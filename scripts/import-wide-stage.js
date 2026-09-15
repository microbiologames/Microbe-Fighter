// Importe un décor panoramique déjà en pixel art (une image large, du type
// « vue en coupe d'une pièce ») et le prépare pour la caméra à défilement.
//
// Contrairement à generate-stage-background.js, ce script n'appelle AUCUNE API :
// l'image est déjà bonne, il n'y a qu'à la mettre à l'échelle et à l'aligner.
//
// Deux choses à faire, et la deuxième est celle qui compte :
//
//   1. mettre l'image à la hauteur du canvas (216 px) pour qu'un pixel du décor
//      vaille un pixel du jeu — c'est ce qui garde le rendu net ;
//   2. ALIGNER SON SOL sur la ligne de sol du moteur (FLOOR_Y = 180). Sans ça,
//      les combattants marchent dans le vide ou sur les meubles.
//
// L'alignement se règle avec deux valeurs :
//
//   floorRatio  la hauteur relative, dans l'image SOURCE, de la ligne où les
//               personnages posent les pieds. 0,79 = à 79 % de la hauteur en
//               partant du haut.
//   height      la hauteur à laquelle mettre l'image entière, en pixels de jeu.
//               C'est le ZOOM : plus elle est grande, plus on entre dans la
//               pièce, plus les combattants paraissent petits par rapport au
//               mobilier — et plus on rogne en haut (le plafond) et en bas.
//
// Le script calcule la fenêtre de 216 px à découper pour que la ligne de sol
// tombe pile sur FLOOR_Y. Avec `height` au minimum (180/floorRatio), la fenêtre
// part du haut de l'image : on garde tout le plafond mais les personnages sont
// énormes. En l'augmentant, on cadre plus bas.
//
// Usage :
//   node scripts/import-wide-stage.js labo                       # valeurs du manifeste
//   node scripts/import-wide-stage.js labo --floor-ratio 0.79 --height 300
//   node scripts/import-wide-stage.js labo --grid                # repères visuels
//
// Le `--grid` écrit une image de contrôle à côté, avec la ligne de sol et la
// silhouette d'un combattant dessinées dessus : c'est le moyen le plus rapide de
// trouver le bon floorRatio sans relancer le jeu.
//
// DÉPENDANCE : Playwright, comme prepare-reference.js — Node ne sait pas décoder
// une image tout seul.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DECORS_DIR = path.join(ROOT, 'references', 'decors');
const STAGE_DIR = path.join(ROOT, 'js', 'data', 'stages');
const SOURCE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];

// Doivent rester en phase avec js/engine/Config.js.
const CANVAS_WIDTH = 384;
const CANVAS_HEIGHT = 216;
const FLOOR_Y = 180;
const DEFAULT_FLOOR_RATIO = FLOOR_Y / CANVAS_HEIGHT; // 0,833 : aucun recadrage

function loadPlaywright() {
  try {
    return require('playwright').chromium;
  } catch {
    return null;
  }
}

// Les fichiers déposés à la main ont rarement le nom exact du slug :
// « Labo (nuit).jpg » doit correspondre à `labo-nuit`. On compare donc les deux
// noms réduits à leurs lettres et chiffres, sans casse ni ponctuation.
function normalise(name) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

function findSource(slug) {
  if (!fs.existsSync(DECORS_DIR)) return null;
  const wanted = normalise(slug);
  for (const file of fs.readdirSync(DECORS_DIR)) {
    const ext = path.extname(file).toLowerCase();
    if (!SOURCE_EXTENSIONS.includes(ext)) continue;
    if (normalise(path.basename(file, path.extname(file))) === wanted) {
      return path.join(DECORS_DIR, file);
    }
  }
  return null;
}

// Tourne dans la page Chromium.
function convertInPage({ dataUrl, canvasWidth, canvasHeight, floorY, floorRatio, height, grid }) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('image illisible'));
    img.onload = () => {
      // Hauteur minimale : celle qui amène la ligne de sol sur floorY en partant
      // du haut de l'image. En dessous, il n'y aurait pas 216 px à découper.
      const minH = Math.round(floorY / floorRatio);
      const scaledH = Math.max(minH, Math.round(height || minH));
      const scaledW = Math.round(img.width * (scaledH / img.height));

      // Décalage vertical de la fenêtre : la ligne de sol de l'image, une fois
      // mise à l'échelle, doit tomber sur floorY dans le canvas.
      const offsetY = Math.round(scaledH * floorRatio - floorY);
      const belowFloor = scaledH - offsetY - canvasHeight;

      const c = document.createElement('canvas');
      c.width = scaledW;
      c.height = canvasHeight;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = 'high';
      g.drawImage(img, 0, 0, img.width, img.height, 0, -offsetY, scaledW, scaledH);

      let gridUrl = null;
      if (grid) {
        const gc = document.createElement('canvas');
        gc.width = Math.min(scaledW, canvasWidth * 3);
        gc.height = canvasHeight;
        const gg = gc.getContext('2d');
        gg.drawImage(c, 0, 0);
        // Ligne de sol
        gg.strokeStyle = '#ff2e63';
        gg.lineWidth = 1;
        gg.beginPath();
        gg.moveTo(0, floorY + 0.5);
        gg.lineTo(gc.width, floorY + 0.5);
        gg.stroke();
        // Silhouettes de combattants, à la hauteur réelle du plus grand (116 px)
        gg.fillStyle = 'rgba(255, 46, 99, 0.45)';
        for (let x = 40; x < gc.width; x += 140) gg.fillRect(x, floorY - 116, 30, 116);
        gridUrl = gc.toDataURL('image/png');
      }

      resolve({
        dataUrl: c.toDataURL('image/png'),
        gridUrl,
        source: { width: img.width, height: img.height },
        scaled: { width: scaledW, height: scaledH },
        croppedTop: offsetY,
        croppedBottom: Math.max(0, belowFloor),
        shortOfFloor: belowFloor < 0 ? -belowFloor : 0,
      });
    };
    img.src = dataUrl;
  });
}

async function main() {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith('--'));
  const grid = args.includes('--grid');
  const ratioIndex = args.indexOf('--floor-ratio');

  if (!slug) {
    console.error('Usage: node scripts/import-wide-stage.js <slug> [--floor-ratio 0.80] [--grid]');
    process.exit(1);
  }

  const chromium = loadPlaywright();
  if (!chromium) {
    console.error('Playwright est introuvable : npm install playwright && npx playwright install chromium');
    process.exit(1);
  }

  const source = findSource(slug);
  if (!source) {
    console.error(`Aucune image references/decors/${slug}.(png|jpg|jpeg|webp)`);
    process.exit(1);
  }

  const manifestPath = path.join(STAGE_DIR, `${slug}.json`);
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
  const floorRatio = ratioIndex !== -1
    ? Number(args[ratioIndex + 1])
    : manifest.floorRatio ?? DEFAULT_FLOOR_RATIO;
  const heightIndex = args.indexOf('--height');
  const height = heightIndex !== -1 ? Number(args[heightIndex + 1]) : manifest.stageHeight ?? 0;

  if (!(floorRatio > 0.2 && floorRatio <= 1)) {
    console.error(`floorRatio invalide : ${floorRatio} (attendu entre 0.2 et 1)`);
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const ext = path.extname(source).toLowerCase().replace('.', '').replace('jpg', 'jpeg');
  const dataUrl = `data:image/${ext};base64,${fs.readFileSync(source).toString('base64')}`;

  const result = await page.evaluate(convertInPage, {
    dataUrl, canvasWidth: CANVAS_WIDTH, canvasHeight: CANVAS_HEIGHT,
    floorY: FLOOR_Y, floorRatio, height, grid,
  });

  if (result.shortOfFloor) {
    console.warn(
      `  ATTENTION : il manque ${result.shortOfFloor} px d'image sous la ligne de sol. ` +
      `Baisse --height ou --floor-ratio.`
    );
  }

  const outPath = path.join(ROOT, 'assets', 'stages', slug, 'background.png');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, Buffer.from(result.dataUrl.split(',')[1], 'base64'));

  // On mémorise le floorRatio retenu dans le manifeste, pour que le prochain
  // import reparte de la même valeur.
  manifest.name = manifest.name ?? slug;
  manifest.background = `assets/stages/${slug}/background.png`;
  manifest.floorRatio = Number(floorRatio.toFixed(4));
  manifest.stageHeight = result.scaled.height;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  const screens = (result.scaled.width / CANVAS_WIDTH).toFixed(2);
  console.log(
    `${path.basename(source)} ${result.source.width}x${result.source.height}\n` +
    `  floorRatio ${floorRatio}, hauteur ${result.scaled.height}  ->  ` +
    `${result.scaled.width}x${result.scaled.height}, ` +
    `${result.croppedTop} px rognés en haut et ${result.croppedBottom} en bas\n` +
    `  décor ${result.scaled.width}x${CANVAS_HEIGHT} (${screens} écrans, ` +
    `${result.scaled.width - CANVAS_WIDTH} px de défilement)\n` +
    `  -> ${path.relative(ROOT, outPath)}`
  );

  if (result.gridUrl) {
    const gridPath = path.join(ROOT, 'assets', 'stages', slug, 'reperes.png');
    fs.writeFileSync(gridPath, Buffer.from(result.gridUrl.split(',')[1], 'base64'));
    console.log(`  repères de réglage -> ${path.relative(ROOT, gridPath)}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error('ERREUR:', err.message);
  process.exit(1);
});
