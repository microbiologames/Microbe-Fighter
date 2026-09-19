export const CANVAS_WIDTH = 384;
export const CANVAS_HEIGHT = 216;

export const FLOOR_Y = 180;
// Marges gauche/droite dans lesquelles un combattant peut évoluer, relatives au
// bord de l'écran — et non au décor, qui peut être bien plus large (voir Camera.js).
export const ARENA_LEFT = 20;
export const ARENA_RIGHT = CANVAS_WIDTH - 20;
// Douceur du suivi de caméra, par frame de 60 Hz : 0 = figée, 1 = collée au
// milieu des combattants. 0,12 donne un défilement souple sans flottement.
export const CAMERA_FOLLOW = 0.12;

export const GRAVITY = 0.75;
// Positif : `y` (hauteur au-dessus du sol) augmente vers le haut, donc une
// vitesse de saut positive fait bien monter le personnage.
export const JUMP_VELOCITY = 10;
export const MOVE_SPEED = 2.4;

export const ROUND_TIME_SECONDS = 60;
export const MAX_HEALTH = 100;

// Hitstun raccourci : à 350 ms l'adversaire restait scotché près d'une demi-
// seconde après chaque coup, ce qui cassait le rythme des échanges.
export const HITSTUN_MS = 220;
export const KNOCKBACK = 3;

export const DODGE_DURATION_MS = 200;
export const DODGE_SPEED = 5;
export const TAUNT_DURATION_MS = 500;

// --- Effets d'état ---------------------------------------------------------
// Facteur appliqué à la vitesse d'un combattant ralenti (gel de Listeria, ou
// biofilm qu'elle s'inflige à elle-même). 1/3 = il avance trois fois moins vite.
export const SLOW_FACTOR = 1 / 3;
// Dégâts par seconde d'une brûlure (bec Bunsen des microbiologistes).
export const BURN_DAMAGE_PER_SEC = 7;
// Le gaz putride de S. putrefaciens : moins violent que la flamme, mais il dure
// plus longtemps et il est le seul effet continu de type toxine.
export const POISON_DAMAGE_PER_SEC = 5;
// Chaque marque d'aflatoxine majore définitivement les dégâts encaissés.
export const MARK_DAMAGE_BONUS = 0.1;
// Teintes appliquées au sprite selon l'état, avec leur opacité.
export const STATUS_TINTS = {
  burning: { color: '#ff7a1a', alpha: 0.5 },
  frozen: { color: '#4fb8ff', alpha: 0.55 },
  trapped: { color: '#e8c84a', alpha: 0.4 },
  poisoned: { color: '#7a8c3a', alpha: 0.5 },
  paralysed: { color: '#9a8fb0', alpha: 0.45 },
  shielded: { color: '#7ee3b8', alpha: 0.35 },
};

// Les cubes dans lesquels un coup `trap` enferme sa cible : elle ne peut plus ni
// bouger ni attaquer le temps de l'effet. `effect.style` choisit lequel ; sans
// style déclaré, c'est la coagulase.
//
// Deux pièges, deux matières. Le plasma coagulé de S. aureus est jaune vif et
// vitreux, la gélose de L. Pasteur est ambrée et plus dense. Un cube unique pour
// les deux aurait laissé croire au même effet alors que rien ne les rapproche.
export const TRAP_CUBES = {
  coagulase: {
    fill: 'rgba(232, 200, 74, 0.28)',
    edge: 'rgba(255, 233, 130, 0.85)',
    padding: 6, // débord du cube autour de la hurtbox, en pixels du canvas
  },
  agar: {
    fill: 'rgba(190, 132, 58, 0.34)',
    edge: 'rgba(236, 186, 110, 0.85)',
    padding: 7,
  },
};

// Fenêtre pendant laquelle une attaque simple qui vient de partir peut encore
// être convertie en super attaque si l'autre bouton est pressé. Sans ça, il
// faudrait presser Poing et Pied dans la même frame de 16 ms : le premier des
// deux déclenche son coup et verrouille le combattant, et la super devient
// pratiquement inatteignable à la main.
export const SUPER_INPUT_WINDOW_MS = 160;

export const ENERGY_MAX = 100;
export const ENERGY_REGEN_PER_SEC = 3; // jauge pleine en ~33s de combat passif
export const ENERGY_TAUNT_BONUS = 30; // narguer remplit +30% d'un coup

export const ROUNDS_TO_WIN = 3;
export const ROUND_RESULT_DISPLAY_MS = 2500;

// --- Cache navigateur -------------------------------------------------------
//
// Les assets sont servis par GitHub Pages avec `cache-control: max-age=600`, et
// un sprite regenere GARDE EXACTEMENT LE MEME NOM DE FICHIER. Le navigateur
// ressert donc l'ancienne image depuis son cache sans redemander au serveur :
// on regenere les dix-sept personnages, on publie, et le joueur voit toujours
// les anciens. Un rechargement simple n'y change rien — il faut un Ctrl+Maj+R,
// ce qu'un joueur ne fera jamais.
//
// `versionne()` ajoute une empreinte a l'URL. Le fichier servi est le meme,
// mais une URL differente est une entree de cache differente : le navigateur
// est oblige d'aller la chercher.
//
// A CHANGER A CHAQUE FOIS QUE LES ASSETS CHANGENT. C'est le seul geste manuel,
// et l'oublier fait reapparaitre exactement le bug qu'on vient de corriger.
export const ASSET_VERSION = '2026-09-19c';

export function versionne(url) {
  if (!url) return url;
  return `${url}${url.includes('?') ? '&' : '?'}v=${ASSET_VERSION}`;
}
