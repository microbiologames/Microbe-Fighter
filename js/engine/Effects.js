// Éclats d'impact dessinés directement en canvas (pas de sprite requis) :
// étoile façon comics + flash lumineux radial, affichés à l'endroit où un
// coup touche. Un léger tremblement d'écran accompagne les gros coups.

const DURATION_MS = 300;
// Les nappes de gaz vivent bien plus longtemps qu'un éclat d'impact : c'est une
// nappe qui s'étale, pas un flash.
const GAS_DURATION_MS = 900;
const SHAKE_DECAY_MS = 220;
const active = [];
let shakeIntensity = 0;
let shakeTimer = 0;

export function spawnHitEffect(x, y, big = false, theme = null) {
  active.push({ x, y, age: 0, big, theme });
  triggerScreenShake(big ? 6 : 3);
}

// Une bouffée de gaz lâchée devant l'attaquant.
//
// Elle est dessinée par le moteur et non par le sprite, faute de mieux : le
// squelette quadrupède de Pixellab ajuste chaque frame au corps de la bête et
// refuse d'y ajouter un effet qui déborde largement, deux tentatives de
// regénération l'ont confirmé. Le gaz de S. putrefaciens serait donc resté
// invisible alors que c'est toute son identité.
//
// Rien ici ne nomme le personnage : n'importe quel coup portant un effet
// `poison` déclenche la nappe, donc un futur perso gazeux l'aura sans ligne de
// code supplémentaire.
export function spawnGasCloud(x, y, facing) {
  for (let i = 0; i < 9; i++) {
    active.push({
      gaz: true,
      x: x + facing * (i * 5 + Math.random() * 8),
      y: y + (Math.random() * 16 - 8),
      // Le sulfure d'hydrogène est plus lourd que l'air : la nappe s'étale au
      // sol au lieu de monter, d'où une vitesse verticale positive.
      vx: facing * (0.35 + Math.random() * 0.5),
      vy: 0.08 + Math.random() * 0.12,
      rayon: 4 + Math.random() * 5,
      age: -i * 25, // les bouffées partent en décalé, ça roule au lieu de gicler
    });
  }
}

export function triggerScreenShake(intensity) {
  shakeIntensity = Math.max(shakeIntensity, intensity);
  shakeTimer = SHAKE_DECAY_MS;
}

export function clearHitEffects() {
  active.length = 0;
  shakeIntensity = 0;
  shakeTimer = 0;
}

export function updateHitEffects(dt) {
  for (let i = active.length - 1; i >= 0; i--) {
    const e = active[i];
    e.age += dt;
    if (e.gaz) {
      if (e.age > 0) {
        e.x += e.vx * (dt / 16);
        e.y += e.vy * (dt / 16);
        e.vx *= 0.97;      // la nappe ralentit en s'étalant
        e.rayon += 0.06 * (dt / 16);
      }
      if (e.age >= GAS_DURATION_MS) active.splice(i, 1);
      continue;
    }
    if (e.age >= DURATION_MS) active.splice(i, 1);
  }
  if (shakeTimer > 0) {
    shakeTimer -= dt;
    if (shakeTimer <= 0) shakeIntensity = 0;
  }
}

export function getScreenShakeOffset() {
  if (shakeTimer <= 0) return { x: 0, y: 0 };
  const amount = shakeIntensity * (shakeTimer / SHAKE_DECAY_MS);
  return { x: (Math.random() * 2 - 1) * amount, y: (Math.random() * 2 - 1) * amount };
}

function drawStar(ctx, size, spikes) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? size : size * 0.42;
    const angle = (Math.PI / spikes) * i - Math.PI / 2;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

// Une bouffée : un dégradé radial vert olive qui grossit et s'efface. Le vert
// est celui de STATUS_TINTS.poisoned, pour qu'on relie la nappe à la teinte que
// prend la cible empoisonnée.
function drawGasPuff(ctx, e) {
  if (e.age < 0) return; // pas encore lâchée
  const t = e.age / GAS_DURATION_MS;
  const alpha = Math.sin(Math.min(t, 1) * Math.PI) * 0.55; // apparaît puis se dissipe
  ctx.save();
  ctx.translate(e.x, e.y);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, e.rayon);
  g.addColorStop(0, `rgba(138, 158, 68, ${alpha})`);
  g.addColorStop(0.6, `rgba(106, 124, 50, ${alpha * 0.7})`);
  g.addColorStop(1, 'rgba(106, 124, 50, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, e.rayon, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRainbow(ctx, size) {
  const bands = 6;
  for (let b = 0; b < bands; b++) {
    const hue = (b / bands) * 300; // rouge -> violet
    ctx.strokeStyle = `hsl(${hue}, 90%, 60%)`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, size * (0.45 + b * 0.16), Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  }
}

function drawLightning(ctx, size) {
  const bolts = 5;
  ctx.strokeStyle = '#fff176';
  ctx.lineWidth = 2;
  for (let i = 0; i < bolts; i++) {
    const angle = (Math.PI * 2 * i) / bolts + Math.PI / 6;
    const segments = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let s = 1; s <= segments; s++) {
      const r = (size * s) / segments;
      const jitter = (Math.random() - 0.5) * size * 0.35;
      const nx = Math.cos(angle) * r + Math.cos(angle + Math.PI / 2) * jitter;
      const ny = Math.sin(angle) * r + Math.sin(angle + Math.PI / 2) * jitter;
      ctx.lineTo(nx, ny);
    }
    ctx.stroke();
  }
}

export function drawHitEffects(ctx) {
  for (const e of active) {
    if (e.gaz) {
      drawGasPuff(ctx, e);
      continue;
    }
    const t = e.age / DURATION_MS; // 0 (impact) -> 1 (disparu)
    const alpha = 1 - t;
    const baseSize = e.big ? 15 : 9;
    const size = baseSize + t * (e.big ? 12 : 7);

    ctx.save();
    ctx.translate(e.x, e.y);

    // flash lumineux radial
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.6);
    glow.addColorStop(0, `rgba(255,255,255,${0.85 * alpha})`);
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha;
    if (e.theme === 'rainbow') {
      drawRainbow(ctx, size);
    } else if (e.theme === 'electric') {
      drawLightning(ctx, size);
    } else {
      // étoile d'impact
      ctx.fillStyle = t < 0.35 ? '#fff' : '#ffd23f';
      drawStar(ctx, size, e.big ? 10 : 7);
    }

    ctx.restore();
  }
}
