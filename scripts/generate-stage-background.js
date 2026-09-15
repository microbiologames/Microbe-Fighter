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

const STAGES = {
  paillasse:
    'a microbiology laboratory bench seen from the side: long stainless steel worktop covered ' +
    'with Bunsen burners, inoculation loops, racks of test tubes, stacks of petri dishes, ' +
    'reagent bottles and a microscope, wall shelves of glassware behind, biohazard sign on the wall',
  'boite-de-petri':
    'the inside of a giant petri dish seen from within, as if shrunk to bacterial size: ' +
    'vast amber agar plain stretching to the horizon, towering colourful bacterial colonies ' +
    'growing like domed hills, glossy translucent dish wall curving up in the far background',
  hotte:
    'the inside of a laminar flow biosafety cabinet seen from the side: white sterile chamber, ' +
    'perforated stainless steel work surface, glowing blue UV lamp along the ceiling, ' +
    'raised glass sash at the top, pipettes and culture flasks lined along the back wall',
  'salle-de-culture':
    'a cell culture room seen from the side: rows of CO2 incubators with glass doors full of ' +
    'culture flasks, an inverted microscope on a bench, pale green and white walls, ' +
    'soft clinical lighting, a glowing incubator display panel',
  congelateur:
    'the inside of a −80 °C ultra-low freezer seen from the side: frost covered metal racks and ' +
    'cryo boxes, thick ice crystals on every surface, pale blue frozen fog drifting along the floor, ' +
    'deep cold blue lighting',
  autoclave:
    'an autoclave room seen from the side: huge cylindrical stainless steel autoclave with a heavy ' +
    'round door open, thick white pressurized steam billowing out, pressure gauges and red valves, ' +
    'wet concrete floor, warm orange warning lights',
  microscope:
    'the surface of a microscope glass slide seen from within, as if shrunk to microbial size: ' +
    'vast flat glass plain under a huge cover slip, giant round bright field of light from the ' +
    'condenser below, out-of-focus stained cells drifting in the deep blue background',
  intestin:
    'the inside of a small intestine seen from within, as if shrunk to bacterial size: ' +
    'pink and red villi walls rising like a forest of soft towers on both sides, ' +
    'glistening mucus floor, warm organic lighting, cartoon microbiome style, not gory',
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
