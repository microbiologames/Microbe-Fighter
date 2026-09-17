// Met la POSE SOUTH générée à côté de l'image de référence, pour juger la
// ressemblance AVANT de dépenser dix animations sur un personnage raté.
//
// C'est la seule étape du pipeline qui demande un œil humain : tout le reste se
// vérifie par un script. La pose south est celle qui montre le visage de face,
// donc la seule sur laquelle une ressemblance se juge.
//
// Usage :
//   node scripts/comparer-poses.js                 tous les persos qui en ont une
//   node scripts/comparer-poses.js pasteur evans   un sous-ensemble
//   node scripts/comparer-poses.js --out /tmp/x.png

const fs = require('fs');
const path = require('path');
const { ROOT, findReferenceImage } = require('./pixellab');
const { CHARACTERS } = require('./characters');

function loadPlaywright() {
  try { return require('playwright').chromium; } catch { return null; }
}

function enPage({ lignes, cell }) {
  return new Promise((resolve) => {
    (async () => {
      const LABEL = 18;
      const c = document.createElement('canvas');
      c.width = cell * 2 + 130;
      c.height = lignes.length * (cell + LABEL);
      const g = c.getContext('2d');
      g.fillStyle = '#1b1d2a';
      g.fillRect(0, 0, c.width, c.height);
      g.font = '13px monospace';
      for (let r = 0; r < lignes.length; r++) {
        const y = r * (cell + LABEL);
        g.fillStyle = '#ffd166';
        g.fillText(lignes[r].nom, 4, y + cell / 2);
        for (let i = 0; i < 2; i++) {
          const src = i === 0 ? lignes[r].ref : lignes[r].pose;
          if (!src) continue;
          const img = new Image();
          img.src = src;
          await img.decode();
          const s = Math.min(cell / img.width, cell / img.height);
          // Le pixel art ne doit pas etre lisse : on le veut tel quel.
          g.imageSmoothingEnabled = i === 0;
          g.drawImage(img, 130 + i * cell + (cell - img.width * s) / 2,
                      y + (cell - img.height * s) / 2, img.width * s, img.height * s);
        }
      }
      g.fillStyle = '#8a90a8';
      g.fillText('référence', 130, 12);
      g.fillText('pose générée', 130 + cell, 12);
      resolve(c.toDataURL('image/png'));
    })();
  });
}

async function main() {
  const args = process.argv.slice(2);
  const outIndex = args.indexOf('--out');
  const out = outIndex !== -1 ? args[outIndex + 1] : path.join(ROOT, 'comparaison-poses.png');
  const voulus = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--out');

  const chromium = loadPlaywright();
  if (!chromium) {
    console.error('Playwright est introuvable : npm install playwright && npx playwright install chromium');
    process.exit(1);
  }

  const cles = voulus.length ? voulus : Object.keys(CHARACTERS);
  const lignes = [];
  for (const cle of cles) {
    const spec = CHARACTERS[cle];
    if (!spec) { console.error(`Perso inconnu : ${cle}`); continue; }
    const pose = path.join(ROOT, 'assets', 'sprites', cle, 'portrait', 'portrait.png');
    if (!fs.existsSync(pose)) continue;
    const ref = findReferenceImage('personnages', cle, spec.reference);
    lignes.push({
      nom: cle,
      ref: ref ? `data:image/${path.extname(ref).slice(1).replace('jpg', 'jpeg')};base64,${fs.readFileSync(ref).toString('base64')}` : null,
      pose: `data:image/png;base64,${fs.readFileSync(pose).toString('base64')}`,
    });
  }
  if (!lignes.length) { console.error('Aucune pose à comparer.'); process.exit(1); }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const url = await page.evaluate(enPage, { lignes, cell: 190 });
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  await browser.close();
  console.log(`${lignes.length} pose(s) -> ${out}`);
}

main().catch((err) => { console.error('ERREUR:', err.message); process.exit(1); });
