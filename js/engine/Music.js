// Musique du jeu : une seule piste, en boucle, du lancement à la fermeture.
//
// Pas de phases, pas de fondu enchaîné, pas de bascule en basse vie — le jeu
// n'en a qu'une et elle tourne en continu.
//
// La seule vraie difficulté est la **politique de lecture automatique** des
// navigateurs : depuis Chrome 66 et Safari 11, un son ne peut pas démarrer avant
// que la personne ait interagi avec la page. Un appel au chargement est donc
// rejeté silencieusement. On réessaie alors au premier geste — et comme l'écran
// titre demande d'appuyer sur Entrée, la musique démarre en pratique dès que le
// joueur touche une touche.

const UNLOCK_EVENTS = ['keydown', 'pointerdown', 'touchstart'];

let track = null;
let waitingForGesture = false;

function attempt() {
  if (!track) return;
  track.play().then(() => {
    waitingForGesture = false;
  }).catch(() => {
    // Lecture automatique refusée : on s'arme pour réessayer au premier geste.
    if (waitingForGesture) return;
    waitingForGesture = true;
    const retry = () => {
      for (const event of UNLOCK_EVENTS) window.removeEventListener(event, retry);
      waitingForGesture = false;
      attempt();
    };
    for (const event of UNLOCK_EVENTS) window.addEventListener(event, retry, { once: true });
  });
}

/** Démarre la musique. Sans effet si elle tourne déjà. */
export function startMusic(src, { volume = 0.5 } = {}) {
  if (!src || track) return;
  track = new Audio(src);
  track.loop = true;
  track.volume = volume;
  // Si le fichier est absent ou illisible, on n'insiste pas : le jeu tourne en
  // silence, comme pour les voix manquantes.
  track.addEventListener('error', () => { track = null; });
  attempt();
}

export function setMusicVolume(volume) {
  if (track) track.volume = Math.max(0, Math.min(1, volume));
}

export function stopMusic() {
  if (!track) return;
  track.pause();
  track = null;
}
