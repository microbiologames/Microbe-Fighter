// Génère les 10 animations de combat d'un personnage (walk, jump, crouch, punch,
// kick, hurt, ko, taunt, victory, superattack) et télécharge les frames dans
// assets/sprites/<perso>/<animation>/000.png, 001.png, ...
//
// `idle` et `portrait` ne sont PAS générés ici : ce sont les poses statiques,
// déjà récupérées par create-character.js depuis les rotations du personnage.
//
// Le character_id est lu tout seul dans references/<perso>.character-id (écrit
// par create-character.js). On peut aussi le passer à la main, ou passer le nom
// du personnage tel qu'il apparaît dans Pixellab.
//
// Usage :
//   node scripts/generate-sprites.js gram
//   node scripts/generate-sprites.js gram punch kick        (sous-ensemble)
//   node scripts/generate-sprites.js gram --id <character_id|"Nom Pixellab">
//
// Persos : gram, petri, staphy, coli

const fs = require('fs');
const path = require('path');
const { ROOT, api, pollJob, downloadFrames, resolveCharacterId } = require('./pixellab');
const { CHARACTERS, KEEP_FIRST_FRAME, ANIMATION_ORDER } = require('./characters');

// Limite de jobs concurrents du compte Pixellab (8 max) : on soumet par lots de 7.
const BATCH_SIZE = 7;
const FRAME_COUNT = 4; // + la frame de départ conservée = 5, ce qu'attendent les manifestes
const EXPECTED_FRAMES = 5;

function storedCharacterId(charKey) {
  const p = path.join(ROOT, 'references', `${charKey}.character-id`);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8').trim() : null;
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
    await pollJob(job.jobId, job.anim);
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

  console.log('\nTéléchargement des frames...');
  const detail = await api('GET', `/characters/${charId}`);
  const missing = [];
  const wrongCount = [];

  for (const job of jobs) {
    const entry = detail.animations.find((a) => a.display_name === job.animationName);
    if (!entry) {
      console.error(`[${job.anim}] MANQUANT côté Pixellab`);
      missing.push(job.anim);
      continue;
    }
    const eastDir = entry.directions.find((d) => d.direction === 'east');
    const destFolder = path.join(ROOT, 'assets', 'sprites', charKey, job.anim);
    await downloadFrames(eastDir.frames, destFolder);
    console.log(`[${job.anim}] ${eastDir.frames.length} frames -> ${path.relative(ROOT, destFolder)}`);
    if (eastDir.frames.length !== EXPECTED_FRAMES) {
      wrongCount.push(`${job.anim} (${eastDir.frames.length})`);
    }
  }

  if (wrongCount.length) {
    console.warn(
      `\nATTENTION : ${wrongCount.join(', ')} — nombre de frames différent de ${EXPECTED_FRAMES}.\n` +
      `Corrige "frameCount" dans js/data/characters/${charKey}.json, ou lance node scripts/check-assets.js.`
    );
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
