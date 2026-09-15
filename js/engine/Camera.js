// Caméra horizontale, pour les décors plus larges que l'écran.
//
// Le canvas fait 384 px de large, mais un décor panoramique (le laboratoire fait
// 1396 px une fois mis à la hauteur du canvas) offre de quoi se déplacer bien
// au-delà. La caméra suit le milieu des deux combattants et bute sur les bords
// du décor : quand les deux avancent à droite, le décor défile, et il se bloque
// quand on atteint le mur du fond.
//
// Conséquence importante pour le reste du moteur : les combattants raisonnent
// désormais en coordonnées MONDE, pas en coordonnées écran. Seul le dessin
// applique le décalage de la caméra (voir drawWorld dans main.js). Les hitbox,
// hurtbox et distances restent donc justes sans rien changer.
//
// Un décor non panoramique (largeur <= celle du canvas) donne une caméra
// immobile en 0 : le jeu se comporte exactement comme avant.

import { CANVAS_WIDTH, ARENA_LEFT, ARENA_RIGHT, CAMERA_FOLLOW } from './Config.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.worldWidth = CANVAS_WIDTH;
  }

  /** Largeur du monde = largeur du décor affiché, jamais moins que l'écran. */
  setStage(stage) {
    const bg = stage?.background;
    this.worldWidth = bg ? Math.max(CANVAS_WIDTH, bg.width) : CANVAS_WIDTH;
    this.x = this.maxX / 2;
  }

  get maxX() {
    return Math.max(0, this.worldWidth - CANVAS_WIDTH);
  }

  /** Position idéale : le milieu des deux combattants au centre de l'écran. */
  targetFor(a, b) {
    const mid = (a.x + b.x) / 2;
    return Math.max(0, Math.min(this.maxX, mid - CANVAS_WIDTH / 2));
  }

  /** Recentrage instantané, au début d'une manche. */
  snapTo(a, b) {
    this.x = this.targetFor(a, b);
  }

  /** Suivi amorti : la caméra rattrape sa cible sans à-coups. */
  update(a, b, dt) {
    const target = this.targetFor(a, b);
    // Lissage indépendant de la fréquence d'affichage : à 60 Hz comme à 144 Hz,
    // la caméra met le même temps à rattraper.
    const t = 1 - Math.pow(1 - CAMERA_FOLLOW, dt / 16.67);
    this.x += (target - this.x) * t;
    if (Math.abs(target - this.x) < 0.05) this.x = target;
  }

  /** Bornes de déplacement d'un combattant, en coordonnées monde : il ne peut
   * jamais sortir de l'écran, c'est la caméra qui ouvre le terrain. */
  get leftBound() {
    return this.x + ARENA_LEFT;
  }

  get rightBound() {
    return this.x + ARENA_RIGHT;
  }
}
