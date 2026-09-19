// Crée un personnage sur Pixellab à partir de l'image de référence déposée dans
// references/personnages/<perso>.(jpg|png|jpeg|webp), puis télécharge ses poses statiques :
//   rotations/east  -> assets/sprites/<perso>/idle/000.png
//   rotations/south -> assets/sprites/<perso>/portrait/portrait.png
//
// Le fichier references/personnages/<perso>.pixellab.json est écrit à côté : il mémorise le
// character_id Pixellab, que generate-sprites.js relit tout seul. Plus besoin de
// recopier un identifiant à la main.
//
// Usage :
//   node scripts/create-character.js gram
//   node scripts/create-character.js gram --description "texte qui remplace celui de characters.js"
//   node scripts/create-character.js gram --no-reference   (génération depuis la seule description)
//   node scripts/create-character.js gram --poses-only     (re-télécharge idle + portrait)
//   node scripts/create-character.js shewanella --template cat  (quadrupède)
//   node scripts/create-character.js pasteur --size 128          (canevas réduit)
//
// Persos : gram, petri, cereus, listeria

const fs = require('fs');
const path = require('path');
const { ROOT, api, pollJob, writeBase64Image, downloadImage, findReferenceImage } = require('./pixellab');
const { CHARACTERS } = require('./characters');

const CHARACTERS_DIR = path.join(ROOT, 'references', 'personnages');

// Les squelettes proposés par Pixellab. Le premier est bipède, les autres non.
const TEMPLATES = ['mannequin', 'bear', 'cat', 'dog', 'horse', 'lion'];

// Mémorise ce qu'il faut pour reprendre le travail sans rien recréer :
// l'id du personnage (pour generate-sprites.js) et l'id du job de création
// (pour --poses-only, qui relit les images base64 de ce job).
function idPath(charKey) {
  return path.join(CHARACTERS_DIR, `${charKey}.pixellab.json`);
}

function readIds(charKey) {
  const p = idPath(charKey);
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  // Ancien format : un fichier texte ne contenant que le character_id.
  const legacy = path.join(ROOT, 'references', `${charKey}.character-id`);
  if (fs.existsSync(legacy)) return { characterId: fs.readFileSync(legacy, 'utf8').trim() };
  return null;
}

function writeIds(charKey, ids) {
  fs.mkdirSync(CHARACTERS_DIR, { recursive: true });
  fs.writeFileSync(idPath(charKey), JSON.stringify(ids, null, 2) + '\n');
}

// Les poses statiques arrivent en base64 dans la réponse du job de création :
// `images` (ou `quantized_images`, la version pixel art à palette réduite) est
// un tableau aligné sur `uploaded_directions`.
// On n'en garde que deux :
//   east  -> la pose de repos, le moteur retourne le sprite pour l'autre sens
//   south -> le personnage face caméra, idéal pour le portrait de sélection
//
// Repli : si le job ne porte pas d'images, on retombe sur `rotation_urls`,
// les URL du CDN de Pixellab (qui peut être bloqué par une politique réseau).
async function savePoses(charKey, charId, job) {
  const response = job?.last_response;
  const directions = response?.uploaded_directions || [];
  const images = response?.quantized_images || response?.images || [];

  const wanted = [
    ['east', path.join(ROOT, 'assets', 'sprites', charKey, 'idle', '000.png'), 'pose de repos'],
    ['south', path.join(ROOT, 'assets', 'sprites', charKey, 'portrait', 'portrait.png'), 'portrait'],
  ];

  let cdnRotations = null;
  for (const [direction, dest, label] of wanted) {
    const index = directions.indexOf(direction);
    if (index !== -1 && images[index]?.base64) {
      writeBase64Image(images[index].base64, dest);
      console.log(`[${charKey}] ${label} -> ${path.relative(ROOT, dest)}`);
      continue;
    }

    if (!cdnRotations) {
      const detail = await api('GET', `/characters/${charId}`);
      cdnRotations = detail.rotation_urls || {};
    }
    const url = cdnRotations[direction];
    if (!url) {
      console.warn(`[${charKey}] rotation "${direction}" introuvable — dépose ${label} à la main`);
      continue;
    }
    try {
      await downloadImage(url, dest);
      console.log(`[${charKey}] ${label} (via CDN) -> ${path.relative(ROOT, dest)}`);
    } catch (err) {
      console.warn(`[${charKey}] ${label} : ${err.message}`);
      console.warn(`[${charKey}] le CDN de Pixellab est peut-être bloqué — dépose le fichier à la main`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const charKey = args[0];
  const spec = CHARACTERS[charKey];

  if (!charKey || !spec) {
    console.error('Usage: node scripts/create-character.js <perso> [--description "..."] [--no-reference]');
    console.error('Persos :', Object.keys(CHARACTERS).join(', '));
    process.exit(1);
  }

  const descIndex = args.indexOf('--description');
  const description = descIndex !== -1 ? args[descIndex + 1] : spec.description;
  const useReference = !args.includes('--no-reference');

  // Re-télécharge idle et portrait d'un personnage déjà créé, sans en refaire
  // un nouveau — utile après un échec en fin de course, ou pour récupérer les
  // poses d'un perso créé à la main dans l'éditeur Pixellab.
  if (args.includes('--poses-only')) {
    const ids = readIds(charKey);
    if (!ids?.characterId) {
      console.error(`Pas d'id connu pour "${charKey}" : lance la création sans --poses-only.`);
      process.exit(1);
    }
    console.log(`[${charKey}] récupération des poses de ${ids.characterId}`);
    const job = ids.creationJobId ? await api('GET', `/background-jobs/${ids.creationJobId}`) : null;
    await savePoses(charKey, ids.characterId, job);
    return;
  }

  // Le template décide du SQUELETTE 3D auquel Pixellab ajuste les frames, donc
  // de la façon dont le personnage pourra être animé. `mannequin` est le seul
  // template bipède ; `bear`, `cat`, `dog`, `horse` et `lion` sont quadrupèdes,
  // et ajoutent d'eux-mêmes « on all fours » à la description.
  //
  // Se tromper ici ne se rattrape pas plus tard : l'endpoint d'animation ne
  // prend pas de template, il hérite de celui du personnage. Un quadrupède créé
  // en `mannequin` sortira debout sur deux pattes à chaque animation.
  const templateIndex = args.indexOf('--template');
  const template = templateIndex !== -1 ? args[templateIndex + 1] : spec.template ?? 'mannequin';
  if (!TEMPLATES.includes(template)) {
    console.error(`Template inconnu : ${template}. Attendu : ${TEMPLATES.join(', ')}`);
    process.exit(1);
  }

  // TAILLE DU CANEVAS : 168, le maximum que l'API accepte en ENTRÉE.
  //
  // On générait en 128, et la ressemblance aux photos de référence en pâtissait
  // — à cette taille un visage occupe une dizaine de pixels, ce qui ne suffit
  // pas à distinguer deux personnes.
  //
  // Attention au piège de la documentation : elle annonce un canevas « pouvant
  // aller jusqu'à 256 px », mais c'est le canevas PERSISTÉ, qui grandit tout
  // seul pour loger le personnage. Demander 192 est refusé avec un 422 :
  // `image_size` est plafonné à 168. C'est ainsi que les sprites de Family
  // Fight font 256 px alors que personne n'a jamais demandé cette taille.
  //
  // Le personnage est ensuite réduit à l'affichage par le `scale` du manifeste,
  // que measure-sprites.js calcule tout seul.
  const TAILLE_MAX = 168;
  const sizeIndex = args.indexOf('--size');
  const size = sizeIndex !== -1 ? Number(args[sizeIndex + 1]) : TAILLE_MAX;
  if (!(size >= 64 && size <= TAILLE_MAX)) {
    console.error(`Taille invalide : ${size} (attendu entre 64 et ${TAILLE_MAX})`);
    process.exit(1);
  }

  // PROPORTIONS. Sans cette consigne, le generateur sort des silhouettes a
  // quatre ou cinq tetes de haut — grosse tete, jambes courtes — alors que les
  // images de reference sont a sept ou huit. C'est ce qui donnait l'impression
  // « trop cartoon », et ni la taille du canevas ni la description du visage ne
  // le corrigeaient : c'est le style par defaut du template mannequin.
  //
  // `style_description` se superpose a la description sans la remplacer, donc
  // les traits du visage restent pilotes par `description`.
  // La consigne par defaut vise les personnages HUMAINS. Une creature peut la
  // refuser via un champ `style` dans characters.js : imposer « petite tete et
  // corps elance » a une grappe de coques, qui n'a pas de tete distincte, ou a
  // un bacille dont tout l'interet est le ventre gonfle, detruirait ce qui fait
  // le personnage.
  const PROPORTIONS =
    'realistic adult human body proportions, small head, long legs, tall and slender, ' +
    'the head about one seventh of the total height, not chibi, not a big-headed cartoon';
  const style = spec.style ?? PROPORTIONS;

  const body = {
    description,
    style_description: style,
    image_size: { width: size, height: size },
    template_id: template,
    view: 'side',
  };
  if (template !== 'mannequin') console.log(`[${charKey}] quadrupède, squelette « ${template} »`);

  if (useReference) {
    const reference = findReferenceImage('personnages', charKey, spec.reference);
    if (!reference) {
      console.error(
        `Aucune image de référence pour "${charKey}".\n` +
        `Dépose-la dans references/personnages/${spec.reference ?? charKey}.jpg, puis relance.\n` +
        `Voir references/README.md. Pour t'en passer : --no-reference`
      );
      process.exit(1);
    }
    const buffer = fs.readFileSync(reference);
    const ext = path.extname(reference).toLowerCase();
    const format = ext === '.png' ? 'png' : ext === '.webp' ? 'webp' : 'jpeg'; // .jpg, .jpeg et .jfif sont du JPEG
    body.method = 'create_from_concept';
    body.concept_image = { type: 'base64', base64: buffer.toString('base64'), format };
    console.log(`[${charKey}] référence : ${path.relative(ROOT, reference)} (${(buffer.length / 1024).toFixed(0)} Ko)`);
  } else {
    console.log(`[${charKey}] sans référence, génération depuis la description seule`);
  }

  console.log(`[${charKey}] ${spec.label} — canevas ${size}x${size}`);
  console.log(`[${charKey}] création sur Pixellab...`);
  const resp = await api('POST', '/create-character-pro', body);
  const charId = resp.character_id;
  console.log(`[${charKey}] character_id ${charId}, job ${resp.background_job_id}, attente...`);

  // L'id est écrit AVANT l'attente : si le sondage casse, le travail déjà payé
  // reste récupérable avec --poses-only.
  writeIds(charKey, { characterId: charId, creationJobId: resp.background_job_id });
  console.log(`[${charKey}] id mémorisé dans ${path.relative(ROOT, idPath(charKey))}`);

  const job = await pollJob(resp.background_job_id, `${charKey}-creation`);
  await savePoses(charKey, charId, job);

  console.log('\nPersonnage créé.');
  console.log('Étape suivante : VÉRIFIER LA RESSEMBLANCE avant de dépenser dix');
  console.log('animations sur un personnage raté :');
  console.log('  node scripts/comparer-poses.js ' + charKey);
  console.log(`Puis, si la pose convient : node scripts/generate-sprites.js ${charKey}`);
}

main().catch((err) => {
  console.error('ERREUR:', err.message);
  process.exit(1);
});
