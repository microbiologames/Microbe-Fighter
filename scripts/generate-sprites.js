// Génère les 10 animations de combat d'un personnage (walk, jump, crouch, punch,
// kick, hurt, ko, taunt, victory, superattack) et télécharge les frames dans
// assets/sprites/<perso>/<animation>/000.png, 001.png, ...
//
// `idle` et `portrait` ne sont PAS générés ici : ce sont les poses statiques,
// déjà récupérées par create-character.js depuis les rotations du personnage.
//
// Le character_id est lu tout seul dans references/personnages/<perso>.pixellab.json (écrit
// par create-character.js). On peut aussi le passer à la main, ou passer le nom
// du personnage tel qu'il apparaît dans Pixellab.
//
// Usage :
//   node scripts/generate-sprites.js gram
//   node scripts/generate-sprites.js gram punch kick        (sous-ensemble)
//   node scripts/generate-sprites.js gram --id <character_id|"Nom Pixellab">
//
// Persos : gram, petri, cereus, listeria

const fs = require('fs');
const path = require('path');
const { ROOT, api, pollJob, writeBase64Frames, downloadFrames, resolveCharacterId } = require('./pixellab');
const { CHARACTERS, KEEP_FIRST_FRAME, ANIMATION_ORDER } = require('./characters');

// Limite de jobs concurrents du compte Pixellab (8 max) : on soumet par lots de 7.
const BATCH_SIZE = 7;
const FRAME_COUNT = 4; // + la frame de départ conservée = 5, ce qu'attendent les manifestes

function storedCharacterId(charKey) {
  const jsonPath = path.join(ROOT, 'references', 'personnages', `${charKey}.pixellab.json`);
  if (fs.existsSync(jsonPath)) return JSON.parse(fs.readFileSync(jsonPath, 'utf8')).characterId || null;
  // Ancien format : un fichier texte ne contenant que le character_id.
  const legacy = path.join(ROOT, 'references', `${charKey}.character-id`);
  return fs.existsSync(legacy) ? fs.readFileSync(legacy, 'utf8').trim() : null;
}

// Aligne "frameCount" du manifeste sur ce que Pixellab a réellement livré.
// C'est la source n°1 d'animations qui sautent : un manifeste qui annonce
// 5 frames alors que le dossier en contient 4 fait charger du vide.
function syncFrameCount(charKey, animName, actualCount) {
  const manifestPath = path.join(ROOT, 'js', 'data', 'characters', `${charKey}.json`);
  if (!fs.existsSync(manifestPath)) return null;
  const raw = fs.readFileSync(manifestPath, 'utf8');
  const pattern = new RegExp(`("${animName}":\\s*\\{[^}]*?"frameCount":\\s*)(\\d+)`);
  const match = raw.match(pattern);
  if (!match) return null;
  const previous = Number(match[2]);
  if (previous === actualCount) return null;
  fs.writeFileSync(manifestPath, raw.replace(pattern, `$1${actualCount}`));
  return previous;
}

async function submitBatch(charId, charKey, batch) {
  for (const job of batch) {
    job.animationName = `${charKey}-${job.anim}-${Date.now()}`;
    console.log(`[${job.anim}] soumission...`);
    const resp = await api('POST', '/characters/animations', {
      character_id: charId,
      animation_name: job.animationName,
      action_description: job.desc,
      mode: 'v3',
      frame_count: FRAME_COUNT,
      directions: ['east'], // le moteur gère le miroir, une seule direction suffit
      keep_first_frame: KEEP_FIRST_FRAME.has(job.anim),
    });
    job.jobId = resp.background_job_ids[0];
    console.log(`[${job.anim}] job ${job.jobId}`);
  }
  for (const job of batch) {
    job.result = await pollJob(job.jobId, job.anim);
    console.log(`[${job.anim}] terminé`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const charKey = args[0];
  const spec = CHARACTERS[charKey];

  if (!charKey || !spec) {
    console.error('Usage: node scripts/generate-sprites.js <perso> [animation ...] [--id <character_id|nom>]');
    console.error('Persos :', Object.keys(CHARACTERS).join(', '));
    process.exit(1);
  }

  const idIndex = args.indexOf('--id');
  const explicitId = idIndex !== -1 ? args[idIndex + 1] : null;
  const only = args.slice(1).filter((a, i, arr) => {
    if (a === '--id') return false;
    if (idIndex !== -1 && arr[i - 1] === '--id') return false;
    return !a.startsWith('--');
  });

  const idOrName = explicitId || storedCharacterId(charKey);
  if (!idOrName) {
    console.error(
      `Pas de character_id pour "${charKey}".\n` +
      `Lance d'abord : node scripts/create-character.js ${charKey}\n` +
      `Ou passe-le à la main : node scripts/generate-sprites.js ${charKey} --id <character_id>`
    );
    process.exit(1);
  }

  const wanted = only.length ? only : ANIMATION_ORDER;
  const unknown = wanted.filter((a) => !spec.anims[a]);
  if (unknown.length) {
    console.error(`Animation(s) inconnue(s) pour ${charKey} : ${unknown.join(', ')}`);
    console.error('Animations :', Object.keys(spec.anims).join(', '));
    process.exit(1);
  }

  const charId = await resolveCharacterId(idOrName);
  console.log(`${spec.label} — character_id ${charId}`);
  console.log(`Animations : ${wanted.join(', ')}\n`);

  const jobs = wanted.map((anim) => ({ anim, desc: spec.anims[anim] }));
  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    await submitBatch(charId, charKey, jobs.slice(i, i + BATCH_SIZE));
  }

  console.log('\nÉcriture des frames...');
  const missing = [];
  const adjusted = [];

  for (const job of jobs) {
    // Les frames sont livrées en base64 dans la réponse du job : pas besoin du
    // CDN de Pixellab, qui est un domaine distinct et parfois inaccessible.
    const images = job.result?.last_response?.images || [];
    const destFolder = path.join(ROOT, 'assets', 'sprites', charKey, job.anim);
    let count;

    if (images.length) {
      count = writeBase64Frames(images, destFolder);
    } else {
      // Repli : les URL du CDN, si le job ne porte pas les images.
      const urls = job.result?.last_response?.storage_urls?.frames;
      if (!urls?.length) {
        console.error(`[${job.anim}] aucune image dans la réponse du job`);
        missing.push(job.anim);
        continue;
      }
      await downloadFrames(urls, destFolder);
      count = urls.length;
    }

    console.log(`[${job.anim}] ${count} frames -> ${path.relative(ROOT, destFolder)}`);
    const previous = syncFrameCount(charKey, job.anim, count);
    if (previous !== null) adjusted.push(`${job.anim} : ${previous} -> ${count}`);
  }

  if (adjusted.length) {
    console.log(`\nframeCount ajusté dans js/data/characters/${charKey}.json :`);
    for (const a of adjusted) console.log(`  · ${a}`);
  }

  if (missing.length) {
    console.error(`\nTerminé avec des animations manquantes : ${missing.join(', ')}`);
    process.exit(1);
  }

  console.log('\nTerminé. Contrôle : node scripts/check-assets.js');
}

main().catch((err) => {
  console.error('ERREUR:', err.message);
  process.exit(1);
});
