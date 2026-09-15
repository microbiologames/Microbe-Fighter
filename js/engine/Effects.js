// Éclats d'impact dessinés directement en canvas (pas de sprite requis) :
// étoile façon comics + flash lumineux radial, affichés à l'endroit où un
// coup touche. Un léger tremblement d'écran accompagne les gros coups.

const DURATION_MS = 300;
const SHAKE_DECAY_MS = 220;
const active = [];
let shakeIntensity = 0;
let shakeTimer = 0;

export function spawnHitEffect(x, y, big = false, theme = null) {
  active.push({ x, y, age: 0, big, theme });
  triggerScreenShake(big ? 6 : 3);
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
    active[i].age += dt;
    if (active[i].age >= DURATION_MS) active.splice(i, 1);
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
