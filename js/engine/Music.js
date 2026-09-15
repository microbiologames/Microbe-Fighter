// Musique de fond en boucle, avec fondu enchaîné entre pistes. Tolérant à
// l'absence de fichier (comme playSfx dans Audio.js) : si la piste n'existe
// pas encore, l'appel ne fait simplement rien d'audible.

const cache = new Map();

function getTrack(src) {
  let audio = cache.get(src);
  if (!audio) {
    audio = new Audio(src);
    audio.loop = true;
    cache.set(src, audio);
  }
  return audio;
}

let current = null;
let currentSrc = null;

export function playMusic(src, { volume = 0.6, fadeMs = 400 } = {}) {
  if (!src || src === currentSrc) return;

  const next = getTrack(src);
  next.volume = 0;
  next.currentTime = 0;
  next.play().catch(() => {});

  const prev = current;
  const start = performance.now();

  function step(now) {
    const t = Math.min(1, (now - start) / fadeMs);
    next.volume = t * volume;
    if (prev) prev.volume = (1 - t) * volume;
    if (t < 1) {
      requestAnimationFrame(step);
    } else if (prev) {
      prev.pause();
    }
  }
  requestAnimationFrame(step);

  current = next;
  currentSrc = src;
}

export function getCurrentMusicSrc() {
  return currentSrc;
}

export function stopMusic({ fadeMs = 400 } = {}) {
  if (!current) return;
  const prev = current;
  const startVolume = prev.volume;
  const start = performance.now();
  current = null;
  currentSrc = null;

  function step(now) {
    const t = Math.min(1, (now - start) / fadeMs);
    prev.volume = startVolume * (1 - t);
    if (t < 1) requestAnimationFrame(step);
    else prev.pause();
  }
  requestAnimationFrame(step);
}
