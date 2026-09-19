// Prépare les images de references/personnages/ et references/decors/ pour
// l'API Pixellab, qui refuse tout
// concept_image de plus de 1024x1024 (erreur 422).
//
// Le script fait deux choses, dans cet ordre :
//   1. recadre sur le personnage en détectant ses bords (tout ce qui n'est pas
//      le fond blanc), avec une marge — une image où le perso occupe 20 % du
//      cadre donne un bien meilleur résultat une fois recadrée ;
//   2. redimensionne le carré obtenu pour tenir dans 1024x1024.
//
// Le résultat est écrit dans references/prepared/<nature>/<nom>.png. create-character.js
// le préfère automatiquement à l'original s'il existe. Les originaux ne sont
// jamais modifiés.
//
// Usage :
//   node scripts/prepare-reference.js                  # toutes les images
//   node scripts/prepare-reference.js gram paillasse   # seulement celles-là
//
// DÉPENDANCE : ce script a besoin d'un Chromium piloté par Playwright pour
// décoder et redimensionner l'image (Node n'a pas de décodeur d'image intégré).
// C'est le SEUL script du dépôt qui a une dépendance, et elle ne sert qu'une
// fois par image. Si Playwright n'est pas installé, le script te le dit et tu
// peux faire la même chose à la main dans n'importe quel éditeur d'image :
// recadrer sur le personnage, exporter en PNG de 1024x1024 maximum, déposer le
// fichier dans references/prepared/.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REFERENCES_DIR = path.join(ROOT, 'references');
const PREPARED_DIR = path.join(REFERENCES_DIR, 'prepared');
// Les deux natures de référence, chacune dans son sous-dossier. La sortie
// reproduit la même arborescence sous prepared/.
const KINDS = ['personnages', 'decors'];
const MAX_SIZE = 1024;
const SOURCE_EXTENSIONS = ['.jpg', '.jpeg', '.jfif', '.png', '.webp']; // .jfif = JPEG (voir pixellab.js)

// Seuil de détection du fond : un pixel est considéré comme du fond s'il est
// presque blanc sur les trois canaux, ou complètement transparent.
const WHITE_THRESHOLD = 244;
const PADDING_RATIO = 0.06;

function loadPlaywright() {
  try {
    return require('playwright').chromium;
  } catch {
    try {
      return require(path.join(process.env.NODE_PATH || '', 'playwright')).chromium;
    } catch {
      return null;
    }
  }
}

function sourcesToPrepare(names) {
  const entries = [];
  for (const kind of KINDS) {
    const dir = path.join(REFERENCES_DIR, kind);
    if (!fs.existsSync(dir)) continue;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isFile()) continue;
      if (!SOURCE_EXTENSIONS.includes(path.extname(e.name).toLowerCase())) continue;
      entries.push({ kind, file: e.name, base: path.basename(e.name, path.extname(e.name)) });
    }
  }

  if (!names.length) return entries;

  const wanted = [];
  for (const name of names) {
    const match = entries.find((e) => e.base === name || e.base.toLowerCase() === name.toLowerCase());
    if (!match) {
      console.error(`Aucune image references/{${KINDS.join(',')}}/${name}.* — ignorée`);
      continue;
    }
    wanted.push(match);
  }
  return wanted;
}

// Tourne dans la page Chromium : recadre sur le contenu puis redimensionne.
function cropAndResizeInPage({ dataUrl, maxSize, whiteThreshold, paddingRatio }) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('image illisible'));
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, c.width, c.height);

      let minX = c.width, minY = c.height, maxX = -1, maxY = -1;
      for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
          const i = (y * c.width + x) * 4;
          const isBackground =
            data[i + 3] < 8 ||
            (data[i] >= whiteThreshold && data[i + 1] >= whiteThreshold && data[i + 2] >= whiteThreshold);
          if (!isBackground) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Image entièrement blanche : on la prend telle quelle.
      if (maxX < 0) {
        minX = 0; minY = 0; maxX = c.width - 1; maxY = c.height - 1;
      }

      const contentW = maxX - minX + 1;
      const contentH = maxY - minY + 1;

      // Carré centré sur le contenu, avec marge : Pixellab travaille en carré,
      // autant lui donner un cadrage déjà propre plutôt qu'une bande 16:9.
      const side = Math.round(Math.max(contentW, contentH) * (1 + paddingRatio * 2));
      const cx = minX + contentW / 2;
      const cy = minY + contentH / 2;
      const sx = Math.round(cx - side / 2);
      const sy = Math.round(cy - side / 2);

      const outSide = Math.min(side, maxSize);
      const out = document.createElement('canvas');
      out.width = outSide;
      out.height = outSide;
      const octx = out.getContext('2d');
      // Fond blanc : le carré peut déborder de l'image source, et un PNG
      // transparent sur les bords trouble la détection de Pixellab.
      octx.fillStyle = '#ffffff';
      octx.fillRect(0, 0, outSide, outSide);
      octx.imageSmoothingEnabled = true;
      octx.imageSmoothingQuality = 'high';
      octx.drawImage(img, sx, sy, side, side, 0, 0, outSide, outSide);

      resolve({
        dataUrl: out.toDataURL('image/png'),
        source: { width: img.width, height: img.height },
        content: { x: minX, y: minY, width: contentW, height: contentH },
        output: outSide,
      });
    };
    img.src = dataUrl;
  });
}

async function main() {
  const names = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const chromium = loadPlaywright();

  if (!chromium) {
    console.error(
      'Playwright est introuvable, ce script ne peut pas décoder les images.\n\n' +
      '  npm install playwright && npx playwright install chromium\n\n' +
      'Ou fais-le à la main, c\'est tout aussi valable : recadre l\'image sur le\n' +
      'personnage, exporte un PNG carré de 1024x1024 maximum, et dépose-le dans\n' +
      'references/prepared/ sous le même nom que le perso.'
    );
    process.exit(1);
  }

  const sources = sourcesToPrepare(names);
  if (!sources.length) {
    console.error(`Aucune image à préparer dans references/{${KINDS.join(',')}}/.`);
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const { kind, file, base } of sources) {
    const srcPath = path.join(REFERENCES_DIR, kind, file);
    const ext = path.extname(file).toLowerCase().replace('.', '').replace('jpg', 'jpeg');
    const dataUrl = `data:image/${ext};base64,${fs.readFileSync(srcPath).toString('base64')}`;

    const result = await page
      .evaluate(cropAndResizeInPage, {
        dataUrl, maxSize: MAX_SIZE, whiteThreshold: WHITE_THRESHOLD, paddingRatio: PADDING_RATIO,
      })
      .catch((err) => { throw new Error(`${file} : ${err.message}`); });

    const outPath = path.join(PREPARED_DIR, kind, `${base}.png`);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, Buffer.from(result.dataUrl.split(',')[1], 'base64'));

    const pct = ((result.content.width * result.content.height) / (result.source.width * result.source.height) * 100).toFixed(1);
    console.log(
      `${kind}/${file}\n` +
      `  source   ${result.source.width}x${result.source.height}\n` +
      `  contenu  ${result.content.width}x${result.content.height} (${pct} % de l'image)\n` +
      `  sortie   ${result.output}x${result.output} -> ${path.relative(ROOT, outPath)}`
    );
  }

  await browser.close();
  console.log('\nTerminé. create-character.js utilisera automatiquement ces versions.');
}

main().catch((err) => {
  console.error('ERREUR:', err.message);
  process.exit(1);
});
