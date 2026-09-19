// Mode Arène : un microbiologiste seul contre des vagues de micro-organismes
// pilotés par la machine.
//
// Une vague est décrite par des DONNÉES, jamais par du code : nombre d'ennemis,
// taille, vitesse de décision, et la présence ou non d'un boss final. Ajouter
// une vague se fait en ajoutant une entrée à VAGUES, sans toucher à la logique.
//
// Trois leviers font monter la difficulté, et ils montent ensemble :
//   1. le NOMBRE d'ennemis présents en même temps (1 puis 2, 3, 4...) ;
//   2. leur TAILLE, donc leur allonge et leurs points de vie ;
//   3. leur TEMPS DE RÉACTION, qui descend de 620 ms à 190 ms.
// La vague se termine quand tous ses ennemis sont K.O. ; les boss ferment les
// vagues 3, 6 et 9.

import { Fighter } from './Fighter.js';
import { Cpu } from './Cpu.js';
import { MAX_HEALTH, CANVAS_WIDTH, ARENA_LEFT, ARENA_RIGHT } from './Config.js';

// Combien d'ennemis peuvent être à l'écran en même temps. Au-delà, les suivants
// attendent qu'une place se libère : une vague de huit reste lisible parce
// qu'elle arrive par paquets de quatre, pas parce qu'elle est plus petite.
const MAX_SIMULTANES = 4;

// Délai entre deux apparitions d'une même vague, et avant la vague suivante.
const DELAI_SPAWN_MS = 900;
const DELAI_ENTRE_VAGUES_MS = 2200;

/**
 * Les neuf vagues. `taille` est un multiplicateur de l'échelle de dessin ET des
 * boîtes de collision : à 1,35 la bactérie est visiblement plus grosse, frappe
 * de plus loin et encaisse davantage.
 *
 * `vie` est un multiplicateur des points de vie ; `force` un multiplicateur des
 * dégâts infligés. Les deux sont volontairement modérés sur les ennemis
 * ordinaires : ce qui tue le joueur en arène, c'est le nombre, pas un ennemi
 * isolé qui taperait trois fois trop fort.
 */
const VAGUES = [
  { nom: 'Vague 1 — contamination', nombre: 2, taille: 0.85, vie: 0.45, force: 0.7, reaction: 620, agressivite: 0.35 },
  { nom: 'Vague 2 — prolifération', nombre: 3, taille: 0.9, vie: 0.5, force: 0.75, reaction: 560, agressivite: 0.4 },
  {
    nom: 'Vague 3 — première souche résistante', nombre: 3, taille: 0.95, vie: 0.55, force: 0.8,
    reaction: 500, agressivite: 0.45,
    boss: { taille: 1.45, vie: 2.2, force: 1.15, reaction: 420, agressivite: 0.6 },
  },
  { nom: 'Vague 4 — biofilm', nombre: 4, taille: 1, vie: 0.6, force: 0.85, reaction: 450, agressivite: 0.5 },
  { nom: 'Vague 5 — rupture de chaîne du froid', nombre: 5, taille: 1.05, vie: 0.65, force: 0.9, reaction: 400, agressivite: 0.55 },
  {
    nom: 'Vague 6 — toxi-infection', nombre: 5, taille: 1.1, vie: 0.7, force: 0.95,
    reaction: 350, agressivite: 0.6,
    boss: { taille: 1.7, vie: 3.2, force: 1.3, reaction: 320, agressivite: 0.7 },
  },
  { nom: 'Vague 7 — contamination croisée', nombre: 6, taille: 1.1, vie: 0.75, force: 1, reaction: 300, agressivite: 0.65 },
  { nom: 'Vague 8 — sporulation', nombre: 7, taille: 1.15, vie: 0.8, force: 1.05, reaction: 250, agressivite: 0.7 },
  {
    nom: 'Vague 9 — épidémie', nombre: 8, taille: 1.2, vie: 0.85, force: 1.1,
    reaction: 190, agressivite: 0.8,
    boss: { taille: 2, vie: 4.5, force: 1.5, reaction: 220, agressivite: 0.85 },
  },
];

export const NOMBRE_DE_VAGUES = VAGUES.length;

/**
 * Adversaire fictif, utilisé entre deux vagues quand il ne reste personne sur
 * le terrain. Le moteur de combat suppose qu'un combattant a TOUJOURS un
 * adversaire : il lit sa position pour s'orienter et le repousse s'il est trop
 * près. Lui passer le joueur lui-même le ferait s'éjecter tout seul, la
 * séparation des corps calculant une distance nulle.
 *
 * Cette cible est très loin, immobile, déjà K.O. et sans corps : le joueur
 * continue donc de jouer normalement, simplement sans rien à frapper.
 */
class CibleAbsente {
  constructor() {
    this.x = 1e6;
    this.y = 0;
    this.ko = true;
    this.invincible = false;
    this.shielded = false;
    this.marks = 0;
  }

  _bodyWidth() { return 0; }
  isImmuneTo() { return true; }
  getHurtbox() { return { x: this.x, y: 0, w: 0, h: 0 }; }
  takeHit() { return 0; }
}

export class Arena {
  /**
   * @param {object} joueur   le Fighter du microbiologiste
   * @param {Array}  microbes les personnages jouables du camp « microbe »
   * @param {Camera} camera
   */
  constructor(joueur, microbes, camera) {
    this.joueur = joueur;
    this.microbes = microbes;
    this.camera = camera;

    this.vagueIndex = 0;
    this.ennemis = [];      // vivants ou en train de tomber, tous dessinés
    this.aFaireApparaitre = []; // gabarits en attente d'une place à l'écran
    this.spawnTimer = 0;
    this.interVagueTimer = 0;
    this.score = 0;
    this.elimines = 0;
    this.termine = false;   // true quand la dernière vague est nettoyée
    this.perdu = false;
    this.annonce = '';
    this.annonceTimer = 0;
    this.cibleAbsente = new CibleAbsente();

    this._prepareVague();
  }

  get vagueCourante() {
    return VAGUES[Math.min(this.vagueIndex, VAGUES.length - 1)];
  }

  get numeroVague() {
    return this.vagueIndex + 1;
  }

  get totalVagues() {
    return VAGUES.length;
  }

  /** Ennemis encore debout — c'est ce que le HUD affiche comme « restants ». */
  get restants() {
    return this.ennemis.filter((e) => !e.ko).length + this.aFaireApparaitre.length;
  }

  _prepareVague() {
    const v = this.vagueCourante;
    this.aFaireApparaitre = [];
    for (let i = 0; i < v.nombre; i++) {
      this.aFaireApparaitre.push({
        taille: v.taille * (0.9 + Math.random() * 0.2), // un peu de variété d'un individu à l'autre
        vie: v.vie, force: v.force, reaction: v.reaction, agressivite: v.agressivite, boss: false,
      });
    }
    // Le boss ferme la vague : il est mis en dernier et n'apparaît donc qu'une
    // fois le gros du peloton déjà sur le terrain ou tombé.
    if (v.boss) this.aFaireApparaitre.push({ ...v.boss, boss: true });
    this.spawnTimer = 400;
    this.annonce = v.nom;
    this.annonceTimer = 2400;
  }

  _faireApparaitre(gabarit) {
    const perso = this.microbes[Math.floor(Math.random() * this.microbes.length)];
    // On entre par le bord opposé au joueur, hors champ si le décor le permet,
    // pour que l'ennemi marche vers lui au lieu de se matérialiser dessus.
    const surSaDroite = this.joueur.x < (this.camera.x + CANVAS_WIDTH / 2);
    const bordGauche = this.camera ? this.camera.leftBound : ARENA_LEFT;
    const bordDroit = this.camera ? this.camera.rightBound : ARENA_RIGHT;
    const x = surSaDroite ? bordDroit - 4 : bordGauche + 4;

    const e = new Fighter(perso, 2, x, surSaDroite ? -1 : 1);
    e.camera = this.camera;
    e.sizeFactor = gabarit.taille;
    e.maxHealth = Math.max(20, Math.round(MAX_HEALTH * gabarit.vie));
    e.health = e.maxHealth;
    e.attackFactor = gabarit.force;
    e.estBoss = !!gabarit.boss;
    // Compte à rebours d'effacement, armé au K.O. ; null tant qu'il est debout.
    e.effacementTimer = null;
    e.cpu = new Cpu({
      agressivite: gabarit.agressivite,
      reaction: gabarit.reaction,
      // Un gros ennemi a une allonge plus longue : sa hitbox est mise à
      // l'échelle comme le reste, il doit donc engager de plus loin.
      portee: 42 * gabarit.taille,
      sautProb: gabarit.boss ? 0.03 : 0.1,
      esquiveProb: gabarit.boss ? 0.02 : 0.08,
    });
    this.ennemis.push(e);
  }

  /** Ennemi vivant le plus proche du joueur, ou null. */
  cibleDuJoueur() {
    let meilleur = null;
    let meilleureDistance = Infinity;
    for (const e of this.ennemis) {
      if (e.ko) continue;
      const d = Math.abs(e.x - this.joueur.x);
      if (d < meilleureDistance) { meilleureDistance = d; meilleur = e; }
    }
    return meilleur;
  }

  update(dt, input) {
    if (this.annonceTimer > 0) this.annonceTimer -= dt;

    // Les ennemis K.O. restent à l'écran le temps de leur animation de chute,
    // puis disparaissent. Sans ce délai, un ennemi vaincu s'évanouit à la frame
    // où sa vie tombe à zéro et le coup n'a pas l'air d'avoir porté.
    for (const e of this.ennemis) {
      if (e.ko && e.effacementTimer === null) {
        e.effacementTimer = 900;
        this.elimines++;
        this.score += e.estBoss ? 500 : 100;
      }
      if (e.ko) e.effacementTimer -= dt;
    }
    this.ennemis = this.ennemis.filter((e) => !e.ko || e.effacementTimer > 0);

    // Apparitions : on remplit jusqu'à MAX_SIMULTANES, un ennemi à la fois.
    if (this.aFaireApparaitre.length && this.ennemis.filter((e) => !e.ko).length < MAX_SIMULTANES) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this._faireApparaitre(this.aFaireApparaitre.shift());
        this.spawnTimer = DELAI_SPAWN_MS;
      }
    }

    // Relu APRÈS l'apparition : un ennemi qui vient d'entrer doit être ciblable
    // et séparé des autres dès sa première frame, sinon il apparaît encastré.
    const vivants = this.ennemis.filter((e) => !e.ko);

    // Vague nettoyée ?
    if (!this.aFaireApparaitre.length && !vivants.length) {
      this.interVagueTimer -= dt;
      if (this.interVagueTimer <= 0) {
        if (this.vagueIndex >= VAGUES.length - 1) {
          this.termine = true;
          return;
        }
        this.vagueIndex++;
        this._prepareVague();
        this.interVagueTimer = DELAI_ENTRE_VAGUES_MS;
        return 'vague-suivante'; // main.js s'en sert pour changer de décor
      }
    } else {
      this.interVagueTimer = DELAI_ENTRE_VAGUES_MS;
    }

    // Le joueur vise l'ennemi le plus proche ; tous les autres restent des
    // cibles valides pour son coup en cours, ce qui rend les vagues jouables.
    const cible = this.cibleDuJoueur() ?? this.cibleAbsente;
    const autres = vivants.filter((e) => e !== cible);
    this.joueur.update(dt, input, cible, autres);

    for (const e of this.ennemis) {
      if (e.ko) { e.update(dt, e.cpu, this.joueur); continue; }
      e.cpu.decide(dt, e, this.joueur);
      e.update(dt, e.cpu, this.joueur);
    }

    this._separerEnnemis(vivants);

    if (this.joueur.ko) this.perdu = true;
    return null;
  }

  /** Le moteur ne sépare un combattant que de SON adversaire désigné. En arène
   * les ennemis ne se voient donc pas entre eux et finiraient empilés au même
   * pixel. Cette passe les écarte deux à deux, doucement, après coup. */
  _separerEnnemis(vivants) {
    for (let i = 0; i < vivants.length; i++) {
      for (let j = i + 1; j < vivants.length; j++) {
        const a = vivants[i];
        const b = vivants[j];
        if (a.y > 18 || b.y > 18) continue; // l'un survole l'autre : on laisse passer
        const minSep = (a._bodyWidth() + b._bodyWidth()) / 2 + 2;
        const ecart = b.x - a.x;
        const distance = Math.abs(ecart) || 0.01;
        if (distance >= minSep) continue;
        const poussee = (minSep - distance) / 2;
        const sens = ecart >= 0 ? 1 : -1;
        a.x -= poussee * sens;
        b.x += poussee * sens;
      }
    }
  }

  dessiner(ctx) {
    // Du plus lointain au plus proche pour que les chevauchements soient lisibles.
    const ordre = [...this.ennemis, this.joueur].sort((p, q) => p.x - q.x);
    for (const f of ordre) f.draw(ctx);
  }
}
