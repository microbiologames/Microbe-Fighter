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
// L'alignement se règle avec `floorRatio` : la hauteur relative, dans l'image
// SOURCE, de la ligne où les personnages doivent poser les pieds. 0,80 veut dire
// « à 80 % de la hauteur de l'image en partant du haut ». Le script met alors
// l'image à l'échelle pour que cette ligne tombe pile sur FLOOR_Y, et rogne ce
// qui dépasse en bas.
//
// Usage :
//   node scripts/import-wide-stage.js labo                    # floorRatio du manifeste
//   node scripts/import-wide-stage.js labo --floor-ratio 0.78 # essai d'une autre valeur
//   node scripts/import-wide-stage.js labo --grid             # repères visuels pour régler
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

function findSource(slug) {
  // Le nom du fichier peut être capitalisé (Labo.jpg) : on compare sans casse.
  if (!fs.existsSync(DECORS_DIR)) return null;
  for (const file of fs.readdirSync(DECORS_DIR)) {
    const ext = path.extname(file).toLowerCase();
    if (!SOURCE_EXTENSIONS.includes(ext)) continue;
    if (path.basename(file, path.extname(file)).toLowerCase() === slug.toLowerCase()) {
      return path.join(DECORS_DIR, file);
    }
  }
  return null;
}

// Tourne dans la page Chromium.
function convertInPage({ dataUrl, canvasWidth, canvasHeight, floorY, floorRatio, grid }) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('image illisible'));
    img.onload = () => {
      // Hauteur à laquelle mettre l'image pour que sa ligne de sol tombe sur floorY.
      const scaledH = Math.round(floorY / floorRatio);
      const scaledW = Math.round(img.width * (scaledH / img.height));

      const c = document.createElement('canvas');
      c.width = scaledW;
      c.height = canvasHeight; // on ne garde que la bande visible, depuis le haut
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = 'high';
      g.drawImage(img, 0, 0, img.width, img.height, 0, 0, scaledW, scaledH);

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
        cropped: scaledH - canvasHeight,
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
    floorY: FLOOR_Y, floorRatio, grid,
  });

  const outPath = path.join(ROOT, 'assets', 'stages', slug, 'background.png');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, Buffer.from(result.dataUrl.split(',')[1], 'base64'));

  // On mémorise le floorRatio retenu dans le manifeste, pour que le prochain
  // import reparte de la même valeur.
  manifest.name = manifest.name ?? slug;
  manifest.background = `assets/stages/${slug}/background.png`;
  manifest.floorRatio = Number(floorRatio.toFixed(4));
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  const screens = (result.scaled.width / CANVAS_WIDTH).toFixed(2);
  console.log(
    `${path.basename(source)} ${result.source.width}x${result.source.height}\n` +
    `  floorRatio ${floorRatio}  ->  mise à l'échelle ${result.scaled.width}x${result.scaled.height}, ` +
    `${result.cropped} px rognés en bas\n` +
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
