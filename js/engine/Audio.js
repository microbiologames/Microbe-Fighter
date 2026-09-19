import { versionne } from './Config.js';
// Lecture de sons, tolérante à l'absence de fichier : tant qu'un son n'a pas
// été déposé dans assets/audio/, l'appel échoue silencieusement (comme les
// sprites placeholder) au lieu de faire planter le jeu.

const cache = new Map();

function getAudio(src) {
  let audio = cache.get(src);
  if (!audio) {
    audio = new Audio(versionne(src));
    cache.set(src, audio);
  }
  return audio;
}

export function playSfx(src, { volume = 1 } = {}) {
  if (!src) return;
  const instance = getAudio(src).cloneNode(true);
  instance.volume = volume;
  instance.play().catch(() => {});
}
