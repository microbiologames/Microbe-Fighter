import { CANVAS_WIDTH, CANVAS_HEIGHT, FLOOR_Y } from './Config.js';

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function loadStage(manifestPath) {
  const res = await fetch(manifestPath);
  if (!res.ok) throw new Error(`Impossible de charger ${manifestPath} (${res.status})`);
  const data = await res.json();

  const background = await loadImage(data.background);

  // Éléments de décor animés en boucle (ventilateur, rideau, télé qui scintille...),
  // dessinés par-dessus le fond statique à une position fixe. Optionnel : un décor
  // sans "props" dans son JSON reste un simple fond fixe.
  const props = await Promise.all(
    (data.props || []).map(async (p) => {
      const pad = (n) => String(n).padStart(3, '0');
      const frames = await Promise.all(
        Array.from({ length: p.frameCount }, (_, i) => loadImage(`${p.folder}/${pad(i)}.png`))
      );
      return { frames, frameDuration: p.frameDuration ?? 150, x: p.x, y: p.y, frameIndex: 0, frameTimer: 0 };
    })
  );

  // `palette` sert uniquement de repli tant que background.png n'existe pas :
  // le décor reste identifiable (couleurs du lieu) au lieu d'un gris générique.
  // Dès que le PNG est déposé, il prend le dessus et la palette n'est plus lue.
  return { name: data.name, background, props, palette: data.palette ?? null };
}

export function updateStage(stage, dt) {
  if (!stage) return;
  for (const prop of stage.props) {
    prop.frameTimer += dt;
    if (prop.frameTimer >= prop.frameDuration) {
      prop.frameTimer -= prop.frameDuration;
      prop.frameIndex = (prop.frameIndex + 1) % prop.frames.length;
    }
  }
}

// Dessine `img` en remplissant tout le rectangle de destination sans le déformer
// (recadre l'excédent au lieu d'étirer) — les photos converties n'ont pas toutes
// exactement le ratio 16:9 du canvas.
function drawCover(ctx, img, dx, dy, dw, dh) {
  const srcRatio = img.width / img.height;
  const dstRatio = dw / dh;
  let sx, sy, sw, sh;
  if (srcRatio > dstRatio) {
    sh = img.height;
    sw = sh * dstRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / dstRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

// Générateur pseudo-aléatoire déterministe : deux appels successifs pour le même
// décor donnent exactement la même silhouette, donc le fond de repli ne
// scintille pas d'une frame à l'autre.
function seededRandom(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Fond de repli dessiné en aplats à partir de la palette du décor : trois bandes
// (fond / paroi / sol) + des silhouettes d'équipement. Ça n'a pas vocation à
// remplacer un vrai background.png, juste à rendre chaque décor reconnaissable
// avant qu'il soit généré.
function drawPaletteBackdrop(ctx, stage) {
  const p = stage?.palette || { far: '#2b2140', mid: '#4a3f6b', floor: '#6b5a3f', accent: '#8a7fb5' };

  ctx.fillStyle = p.far;
  ctx.fillRect(0, 0, CANVAS_WIDTH, FLOOR_Y);
  ctx.fillStyle = p.mid;
  ctx.fillRect(0, FLOOR_Y - 64, CANVAS_WIDTH, 64);
  ctx.fillStyle = p.floor;
  ctx.fillRect(0, FLOOR_Y, CANVAS_WIDTH, CANVAS_HEIGHT - FLOOR_Y);

  // Silhouettes d'équipement, volontairement discrètes : elles doivent se lire
  // comme du décor lointain, pas entrer en concurrence avec les combattants.
  const rand = seededRandom(stage?.name || 'stage');
  ctx.fillStyle = p.accent;
  ctx.globalAlpha = 0.28;
  for (let i = 0; i < 9; i++) {
    const w = 10 + Math.floor(rand() * 26);
    const h = 10 + Math.floor(rand() * 34);
    const x = Math.floor(rand() * (CANVAS_WIDTH - w));
    ctx.fillRect(x, FLOOR_Y - 64 - h, w, h);
  }
  ctx.globalAlpha = 1;
}

export function drawStage(ctx, stage, cameraX = 0) {
  const bg = stage?.background;
  if (bg && bg.width > CANVAS_WIDTH) {
    // Décor panoramique : on n'affiche que la fenêtre visible, à la position de
    // la caméra. L'image est déjà à la hauteur du canvas, donc pas de mise à
    // l'échelle — un pixel du décor = un pixel du jeu, ce qui garde le rendu net.
    ctx.imageSmoothingEnabled = false;
    const sx = Math.max(0, Math.min(bg.width - CANVAS_WIDTH, Math.round(cameraX)));
    ctx.drawImage(bg, sx, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else if (bg) {
    ctx.imageSmoothingEnabled = false;
    drawCover(ctx, bg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else {
    drawPaletteBackdrop(ctx, stage);
  }

  ctx.imageSmoothingEnabled = false;
  for (const prop of stage?.props || []) {
    const frame = prop.frames[prop.frameIndex];
    if (frame) ctx.drawImage(frame, prop.x, prop.y);
  }

  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y + 1);
  ctx.lineTo(CANVAS_WIDTH, FLOOR_Y + 1);
  ctx.stroke();
}
