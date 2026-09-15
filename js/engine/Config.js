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
// Teintes appliquées au sprite selon l'état, avec leur opacité.
export const STATUS_TINTS = {
  burning: { color: '#ff7a1a', alpha: 0.5 },
  frozen: { color: '#4fb8ff', alpha: 0.55 },
  shielded: { color: '#7ee3b8', alpha: 0.35 },
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
