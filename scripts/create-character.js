// Crée un personnage sur Pixellab à partir de l'image de référence déposée dans
// references/<perso>.(png|jpg|jpeg|webp), puis télécharge ses poses statiques :
//   rotations/east  -> assets/sprites/<perso>/idle/000.png
//   rotations/south -> assets/sprites/<perso>/portrait/portrait.png
//
// Le fichier references/<perso>.character-id est écrit à côté : il mémorise le
// character_id Pixellab, que generate-sprites.js relit tout seul. Plus besoin de
// recopier un identifiant à la main.
//
// Usage :
//   node scripts/create-character.js gram
//   node scripts/create-character.js gram --description "texte qui remplace celui de characters.js"
//   node scripts/create-character.js gram --no-reference   (génération depuis la seule description)
//
// Persos : gram, petri, staphy, coli

const fs = require('fs');
const path = require('path');
const { ROOT, api, pollJob, downloadImage } = require('./pixellab');
const { CHARACTERS } = require('./characters');

const REFERENCES_DIR = path.join(ROOT, 'references');
const EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];

function findReference(charKey) {
  for (const ext of EXTENSIONS) {
    const p = path.join(REFERENCES_DIR, charKey + ext);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function characterIdPath(charKey) {
  return path.join(REFERENCES_DIR, `${charKey}.character-id`);
}

async function savePoses(charKey, charId) {
  const detail = await api('GET', `/characters/${charId}`);
  const rotations = detail.rotations || detail.directions || [];

  const pick = (direction) => {
    const entry = rotations.find((r) => (r.direction || r.name) === direction);
    return entry && (entry.url || entry.image_url || entry.image);
  };

  const east = pick('east');
  if (east) {
    const dest = path.join(ROOT, 'assets', 'sprites', charKey, 'idle', '000.png');
    await downloadImage(east, dest);
    console.log(`[${charKey}] pose de repos -> ${path.relative(ROOT, dest)}`);
  } else {
    console.warn(`[${charKey}] rotation "east" introuvable — dépose idle/000.png à la main`);
  }

  const south = pick('south');
  if (south) {
    const dest = path.join(ROOT, 'assets', 'sprites', charKey, 'portrait', 'portrait.png');
    await downloadImage(south, dest);
    console.log(`[${charKey}] portrait -> ${path.relative(ROOT, dest)}`);
  } else {
    console.warn(`[${charKey}] rotation "south" introuvable — dépose portrait.png à la main`);
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

  const body = {
    description,
    image_size: { width: 128, height: 128 },
    template_id: 'mannequin',
    view: 'side',
  };

  if (useReference) {
    const reference = findReference(charKey);
    if (!reference) {
      console.error(
        `Aucune image de référence pour "${charKey}".\n` +
        `Dépose-la dans references/${charKey}.png (ou .jpg), puis relance.\n` +
        `Voir references/README.md. Pour t'en passer : --no-reference`
      );
      process.exit(1);
    }
    const buffer = fs.readFileSync(reference);
    const ext = path.extname(reference).toLowerCase();
    const format = ext === '.png' ? 'png' : ext === '.webp' ? 'webp' : 'jpeg';
    body.method = 'create_from_concept';
    body.concept_image = { type: 'base64', base64: buffer.toString('base64'), format };
    console.log(`[${charKey}] référence : ${path.relative(ROOT, reference)} (${(buffer.length / 1024).toFixed(0)} Ko)`);
  } else {
    console.log(`[${charKey}] sans référence, génération depuis la description seule`);
  }

  console.log(`[${charKey}] ${spec.label}`);
  console.log(`[${charKey}] création sur Pixellab...`);
  const resp = await api('POST', '/create-character-pro', body);
  const charId = resp.character_id;
  console.log(`[${charKey}] character_id ${charId}, job ${resp.background_job_id}, attente...`);
  await pollJob(resp.background_job_id, `${charKey}-creation`);

  fs.mkdirSync(REFERENCES_DIR, { recursive: true });
  fs.writeFileSync(characterIdPath(charKey), charId + '\n');
  console.log(`[${charKey}] id mémorisé dans ${path.relative(ROOT, characterIdPath(charKey))}`);

  await savePoses(charKey, charId);

  console.log('\nPersonnage créé.');
  console.log(`Étape suivante : node scripts/generate-sprites.js ${charKey}`);
}

main().catch((err) => {
  console.error('ERREUR:', err.message);
  process.exit(1);
});
