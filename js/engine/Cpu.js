// Pilote automatique d'un combattant, pour le mode Arène.
//
// Le Fighter ne connaît qu'une seule source d'ordres : un objet qui répond à
// `isDown(playerIndex, action)` et `justPressed(playerIndex, action)`. C'est
// exactement l'interface de Input. Une IA est donc simplement un autre objet
// qui répond à ces deux méthodes — le moteur de combat n'a rien à savoir de
// plus, et une bactérie pilotée par la machine obéit aux mêmes règles qu'un
// joueur : même portée, même temps d'animation, mêmes effets d'état.
//
// L'IA ignore `playerIndex` : chaque ennemi possède son propre Cpu, il n'y a
// donc jamais d'ambiguïté sur à qui s'adresse l'ordre.

import { ENERGY_MAX } from './Config.js';

// Distance (en px monde) sous laquelle l'ennemi considère qu'il peut toucher.
// Un peu plus courte que la portée réelle des coups : mieux vaut un ennemi qui
// s'approche trop que des coups qui battent l'air en permanence.
const PORTEE_BASE = 42;

export class Cpu {
  /**
   * @param {object} profil
   *   agressivite  0..1  — probabilité d'attaquer quand la cible est à portée
   *   reaction     ms    — délai entre deux décisions ; c'est le vrai curseur
   *                        de difficulté, un ennemi qui décide toutes les
   *                        600 ms se contourne, un qui décide toutes les
   *                        180 ms colle au joueur.
   *   sautProb     0..1  — probabilité de sauter lors d'une décision
   *   esquiveProb  0..1  — probabilité d'esquiver lors d'une décision
   *   portee       px    — distance d'engagement
   */
  constructor(profil = {}) {
    this.agressivite = profil.agressivite ?? 0.5;
    this.reaction = profil.reaction ?? 420;
    this.sautProb = profil.sautProb ?? 0.08;
    this.esquiveProb = profil.esquiveProb ?? 0.06;
    this.portee = profil.portee ?? PORTEE_BASE;

    this.held = new Set();
    this.pressed = new Set();
    // Désynchronise les ennemis d'une même vague : sans ce décalage initial,
    // six bactéries lâchées ensemble décident toutes à la même frame et
    // avancent en bloc comme un seul corps.
    this.timer = Math.random() * this.reaction;
  }

  isDown(_playerIndex, action) {
    return this.held.has(action);
  }

  justPressed(_playerIndex, action) {
    return this.pressed.has(action);
  }

  /** À appeler une fois par frame AVANT le update() du combattant piloté. */
  decide(dt, moi, cible) {
    this.pressed.clear();
    if (!moi || !cible || moi.ko) {
      this.held.clear();
      return;
    }

    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer += this.reaction;

    this.held.clear();

    const ecart = cible.x - moi.x;
    const distance = Math.abs(ecart);
    const versLaCible = ecart >= 0 ? 'right' : 'left';

    if (distance > this.portee) {
      // Trop loin : on marche vers la cible. Un saut de temps en temps, qui
      // sert surtout à franchir un ennemi qui bloque le passage.
      this.held.add(versLaCible);
      if (Math.random() < this.sautProb) this.pressed.add('up');
      return;
    }

    // À portée : on frappe, ou on recule pour ne pas rester collé.
    if (Math.random() < this.agressivite) {
      // La super attaque part dès que la jauge est pleine. Le moteur exige
      // poing + pied pour un joueur humain ; l'IA maintient l'un et presse
      // l'autre dans la même frame, ce qui emprunte exactement le même chemin.
      if (moi.energy >= ENERGY_MAX && moi.character.moves.superattack) {
        this.held.add('kick');
        this.pressed.add('punch');
      } else {
        this.pressed.add(Math.random() < 0.6 ? 'punch' : 'kick');
      }
      return;
    }

    if (Math.random() < this.esquiveProb) {
      this.pressed.add('dodge');
      return;
    }
    // Petit pas de recul : donne au joueur une fenêtre pour répliquer.
    this.held.add(versLaCible === 'right' ? 'left' : 'right');
  }
}
