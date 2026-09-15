export const CANVAS_WIDTH = 384;
export const CANVAS_HEIGHT = 216;

export const FLOOR_Y = 180;
export const ARENA_LEFT = 20;
export const ARENA_RIGHT = CANVAS_WIDTH - 20;

export const GRAVITY = 0.6;
// Positif : `y` (hauteur au-dessus du sol) augmente vers le haut, donc une
// vitesse de saut positive fait bien monter le personnage.
export const JUMP_VELOCITY = 8.5;
export const MOVE_SPEED = 1.4;

export const ROUND_TIME_SECONDS = 60;
export const MAX_HEALTH = 100;

export const HITSTUN_MS = 350;
export const KNOCKBACK = 3;

export const DODGE_DURATION_MS = 250;
export const DODGE_SPEED = 3.5;
export const TAUNT_DURATION_MS = 700;

export const ENERGY_MAX = 100;
export const ENERGY_REGEN_PER_SEC = 3; // jauge pleine en ~33s de combat passif
export const ENERGY_TAUNT_BONUS = 30; // narguer remplit +30% d'un coup

export const ROUNDS_TO_WIN = 3;
export const ROUND_RESULT_DISPLAY_MS = 2500;
