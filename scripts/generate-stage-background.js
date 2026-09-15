// Génère les fonds de décor en pixel art via Pixellab et les enregistre dans
// assets/stages/<slug>/background.png (le manifeste js/data/stages/<slug>.json
// existe déjà et n'est pas réécrit).
//
// Deux modes, choisis automatiquement :
//   - si references/decors/<slug>.(jpg|jpeg|png|webp) existe -> /image-to-pixelart-pro
//     (conversion fidèle d'une photo)
//   - sinon -> /generate-image-pixflux (génération depuis la description seule)
//
// Usage :
//   node scripts/generate-stage-background.js paillasse hotte
//   node scripts/generate-stage-background.js --all
//   node scripts/generate-stage-background.js paillasse@<jobId>   (reprise d'un job)

const fs = require('fs');
const path = require('path');
const { ROOT, api, pollJob, findReferenceImage } = require('./pixellab');

const STAGE_WIDTH = 512;
const STAGE_HEIGHT = 288; // 16:9, multiple propre du canvas 384x216

const STYLE = [
  '2D fighting game stage background, pixel art, flat side-view backdrop,',
  'wide-angle framing showing the full width of the room, clear flat floor',
  'plane in the foreground where characters will stand, nothing in the way of',
  'the fighters. No people, no characters, empty scene. Bright even lighting,',
  'crisp clean pixel art outlines, retro 16-bit arcade fighting game stage',
  'aesthetic (Street Fighter / King of Fighters style), consistent color',
  'palette, no blur, no photo-realistic texture noise, no text, no logos.',
].join(' ');

// Décors générables par l'API. Le jeu tourne aujourd'hui sur deux panoramiques
// importés à la main (voir scripts/import-wide-stage.js) ; cette liste sert à
// créer un décor de plus, à partir d'une photo ou d'une simple description.
// Les huit décors de laboratoire décrits ici auparavant (paillasse, boîte de
// Pétri, hotte, salle de culture, congélateur, autoclave, microscope, intestin)
// ont été retirés du jeu ; leurs descriptions restent dans l'historique git.
const STAGES = {
  paillasse:
    'a microbiology laboratory bench seen from the side: long stainless steel worktop covered ' +
    'with Bunsen burners, inoculation loops, racks of test tubes, stacks of petri dishes, ' +
    'reagent bottles and a microscope, wall shelves of glassware behind, biohazard sign on the wall',
};


function saveResult(slug, job) {
  const base64 = job.last_response?.image?.base64;
  if (!base64) throw new Error(`Réponse sans image pour ${slug} : ${JSON.stringify(job.last_response)}`);
  const out = path.join(ROOT, 'assets', 'stages', slug, 'background.png');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(base64, 'base64'));
  console.log(`[${slug}] enregistré -> ${path.relative(ROOT, out)}`);
}

async function processStage(slug) {
  const description = STAGES[slug];
  if (!description) throw new Error(`Décor inconnu: ${slug}`);
  const fullDescription = `${description}. ${STYLE}`;

  const reference = findReferenceImage('decors', slug);
  let jobId;

  if (reference) {
    const buffer = fs.readFileSync(reference);
    const ext = path.extname(reference).toLowerCase();
    const format = ext === '.png' ? 'png' : ext === '.webp' ? 'webp' : 'jpeg';
    console.log(`[${slug}] conversion de ${path.basename(reference)}...`);
    const submit = await api('POST', '/image-to-pixelart-pro', {
      image: { type: 'base64', base64: buffer.toString('base64'), format },
      description: fullDescription,
    });
    jobId = submit.background_job_id;
  } else {
    console.log(`[${slug}] génération depuis la description (pas de référence dans references/decors/)...`);
    const submit = await api('POST', '/generate-image-pixflux', {
      description: fullDescription,
      image_size: { width: STAGE_WIDTH, height: STAGE_HEIGHT },
    });
    jobId = submit.background_job_id;
  }

  console.log(`[${slug}] job ${jobId}, attente...`);
  saveResult(slug, await pollJob(jobId, slug));
}

// Reprend un job déjà soumis (le script a planté pendant le sondage) au lieu de
// payer une nouvelle génération.
async function resumeStage(slug, jobId) {
  if (!STAGES[slug]) throw new Error(`Décor inconnu: ${slug}`);
  console.log(`[${slug}] reprise du job ${jobId}, attente...`);
  saveResult(slug, await pollJob(jobId, slug));
}

async function main() {
  const args = process.argv.slice(2);
  const entries = args[0] === '--all' ? Object.keys(STAGES) : args;
  if (entries.length === 0) {
    console.error('Usage: node scripts/generate-stage-background.js <slug|slug@jobId> [...] | --all');
    console.error('Décors :', Object.keys(STAGES).join(', '));
    process.exit(1);
  }

  const failures = [];
  for (const entry of entries) {
    try {
      if (entry.includes('@')) {
        const [slug, jobId] = entry.split('@');
        await resumeStage(slug, jobId);
      } else {
        await processStage(entry);
      }
    } catch (err) {
      console.error(`[${entry}] ÉCHEC : ${err.message}`);
      failures.push(entry);
    }
  }

  if (failures.length > 0) {
    console.error(`\nTerminé avec des échecs : ${failures.join(', ')}`);
    process.exit(1);
  }
  console.log('\nTerminé.');
}

main().catch((err) => {
  console.error('ERREUR:', err.message);
  process.exit(1);
});
