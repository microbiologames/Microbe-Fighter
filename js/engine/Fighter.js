import {
  FLOOR_Y, ARENA_LEFT, ARENA_RIGHT, GRAVITY, JUMP_VELOCITY, MOVE_SPEED,
  MAX_HEALTH, HITSTUN_MS, KNOCKBACK, DODGE_DURATION_MS, DODGE_SPEED, TAUNT_DURATION_MS,
  ENERGY_MAX, ENERGY_REGEN_PER_SEC, ENERGY_TAUNT_BONUS, SUPER_INPUT_WINDOW_MS,
  SLOW_FACTOR, BURN_DAMAGE_PER_SEC, POISON_DAMAGE_PER_SEC, MARK_DAMAGE_BONUS,
  STATUS_TINTS, TRAP_CUBES,
} from './Config.js';
import { spawnHitEffect, spawnGasCloud } from './Effects.js';
import { spawnAllies } from './Allies.js';
import { playSfx } from './Audio.js';

// Valeurs par défaut si le perso ne définit pas son propre "hurtbox" dans son JSON.
const DEFAULT_BODY_WIDTH = 20;
const DEFAULT_BODY_HEIGHT_STAND = 48;
const DEFAULT_BODY_HEIGHT_CROUCH = 32;
const MIN_SEPARATION = 24;
// Au-dessus de cette hauteur, un combattant survole l'autre : la séparation des
// corps est levée, ce qui permet de sauter par-dessus l'adversaire et de
// changer de côté. `facing` étant recalculé à chaque frame, les deux continuent
// de se faire face après le croisement.
const CROSS_OVER_HEIGHT = 18;

// Teinture d'un sprite, mise en cache : on redessine la frame dans un canvas
// hors écran et on la recouvre en `source-atop`, ce qui ne colore que les
// pixels opaques du personnage et préserve sa silhouette.
const tintCache = new WeakMap();
function tintedFrame(frame, color) {
  let byColor = tintCache.get(frame);
  if (!byColor) {
    byColor = new Map();
    tintCache.set(frame, byColor);
  }
  let canvas = byColor.get(color);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = frame.width;
    canvas.height = frame.height;
    const g = canvas.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(frame, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = color;
    g.fillRect(0, 0, canvas.width, canvas.height);
    byColor.set(color, canvas);
  }
  return canvas;
}

export class Fighter {
  constructor(character, playerIndex, startX, facing) {
    this.character = character;
    this.playerIndex = playerIndex;
    this.x = startX;
    this.y = 0; // hauteur au-dessus du sol (0 = au sol), augmente vers le haut
    this.vx = 0;
    this.vy = 0;
    this.facing = facing; // 1 = vers la droite, -1 = vers la gauche

    // Trois réglages que le mode Arène fait varier d'un ennemi à l'autre, et
    // que le mode 1 contre 1 laisse à leur valeur neutre. Ils sont portés par
    // le COMBATTANT, pas par le personnage : deux B. cereus de la même vague
    // peuvent avoir des tailles et des points de vie différents.
    this.maxHealth = MAX_HEALTH;
    this.sizeFactor = 1;   // multiplie l'échelle de dessin ET les boîtes
    this.attackFactor = 1; // multiplie les dégâts que ce combattant inflige

    this.health = this.maxHealth;
    this.state = 'idle';
    this.animName = 'idle';
    this.frameIndex = 0;
    this.frameTimer = 0;

    this.hitstunTimer = 0;
    this.attackName = null;
    this.attackHasHit = false;
    // En mode Arène un coup peut traverser plusieurs ennemis d'un coup. On
    // retient donc QUI a déjà été touché par le coup en cours, au lieu du
    // simple booléen qui suffisait à un contre un — sans quoi frapper dans une
    // vague de six bactéries n'en toucherait jamais qu'une.
    this.hitTargets = new Set();
    this.gasSpawned = false;
    this.attackElapsed = 0; // depuis le début du coup en cours, pour la fenêtre de super
    this.ko = false;
    this.winner = false;

    this.invincible = false;
    this.actionTimer = 0;
    this.energy = 0;
    this.camera = null; // posée par main.js au début du combat

    // Effets d'état, tous exprimés en millisecondes restantes. Ils sont posés
    // par les `effect` déclarés dans les coups du JSON du personnage, jamais
    // codés en dur ici — voir _applyEffect().
    this.burnTimer = 0;      // brûlure : dégâts continus (bec Bunsen)
    this.burnResidue = 0;    // fraction de dégât en attente entre deux frames
    this.frozenTimer = 0;    // gelé : ralenti (attaque spéciale de Listeria)
    this.shieldTimer = 0;    // invulnérable (biofilm de Listeria)
    this.selfSlowTimer = 0;  // ralentissement qu'on s'inflige (biofilm)
    this.trappedTimer = 0;   // figé dans un cube (coagulase ou gélose)
    this.trapStyle = 'coagulase'; // quel cube dessiner, posé par l'effet
    this.paralysedTimer = 0; // paralysie flasque : marche mais ne peut plus agir
    this.poisonTimer = 0;    // gaz putride : dégâts continus
    this.poisonResidue = 0;
    this.marks = 0;          // marques d'aflatoxine : vulnérabilité permanente
  }

  /** Paralysie flasque de la neurotoxine botulique : les jambes répondent
   * encore, plus rien d'autre. C'est la différence avec la coagulase, qui
   * cloue complètement sur place. */
  get paralysed() {
    return this.paralysedTimer > 0;
  }

  /** Figé : ne peut plus ni se déplacer ni attaquer, mais encaisse toujours. */
  get trapped() {
    return this.trappedTimer > 0;
  }

  get slowed() {
    return this.frozenTimer > 0 || this.selfSlowTimer > 0;
  }

  get shielded() {
    return this.shieldTimer > 0;
  }

  /** Teinte à appliquer au sprite, ou null. La brûlure prime sur le gel, qui
   * prime sur le bouclier : c'est l'ordre de gravité pour le joueur. */
  _statusTint() {
    if (this.burnTimer > 0) return STATUS_TINTS.burning;
    if (this.poisonTimer > 0) return STATUS_TINTS.poisoned;
    if (this.frozenTimer > 0) return STATUS_TINTS.frozen;
    if (this.trappedTimer > 0) return STATUS_TINTS.trapped;
    if (this.paralysedTimer > 0) return STATUS_TINTS.paralysed;
    if (this.shieldTimer > 0) return STATUS_TINTS.shielded;
    return null;
  }

  /** Décompte les effets et applique les dégâts de brûlure. */
  _tickStatuses(dt) {
    if (this.frozenTimer > 0) this.frozenTimer -= dt;
    if (this.shieldTimer > 0) this.shieldTimer -= dt;
    if (this.selfSlowTimer > 0) this.selfSlowTimer -= dt;
    if (this.trappedTimer > 0) this.trappedTimer -= dt;
    if (this.paralysedTimer > 0) this.paralysedTimer -= dt;

    // Brûlure et gaz putride marchent pareil : des dégâts par seconde, mis à
    // l'échelle de la résistance au type correspondant.
    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.burnResidue = this._tickDamageOverTime(
        this.burnResidue, BURN_DAMAGE_PER_SEC * this.damageFactor('chaleur'), dt);
    }
    if (this.poisonTimer > 0) {
      this.poisonTimer -= dt;
      this.poisonResidue = this._tickDamageOverTime(
        this.poisonResidue, POISON_DAMAGE_PER_SEC * this.damageFactor('toxine'), dt);
    }
  }

  /** Un tick de dégâts continus. Les dégâts par frame sont fractionnaires : on
   * reporte le reste d'une frame sur la suivante, sinon les décimales se
   * perdent et une brûlure de 7/s n'en inflige que 4. Renvoie le nouveau
   * reliquat. */
  _tickDamageOverTime(residue, perSecond, dt) {
    residue += (perSecond * dt) / 1000;
    const whole = Math.floor(residue);
    if (whole > 0) {
      residue -= whole;
      this.health = Math.max(0, this.health - whole);
      if (this.health <= 0 && !this.ko) {
        this.ko = true;
        this.state = 'ko';
        this.setAnimation('ko');
        playSfx(this.character.sfx?.ko);
      }
    }
    return residue;
  }

  /** Applique l'`effect` d'un coup. `self` reçoit les effets qui se posent sur
   * l'attaquant (bouclier, téléportation), `target` ceux qui se posent sur
   * l'adversaire (brûlure, gel). */
  /** Un personnage peut être totalement insensible à un effet, via "immunities"
   * dans son JSON. Une résistance réduit les DÉGÂTS ; une immunité annule
   * l'ÉTAT. P. fluorescens pousse à 4 °C : la geler n'a aucun sens, et un
   * simple `froid: 0` ne l'aurait pas empêchée d'être ralentie. */
  isImmuneTo(effectType) {
    return this.character.immunities?.includes(effectType) ?? false;
  }

  static applyEffect(effect, self, target) {
    if (!effect) return;
    // Le biofilm protège de tout ce qui se pose sur la cible, et une immunité
    // déclarée protège de son effet en particulier.
    if (target && (target.shielded || target.isImmuneTo(effect.type))) {
      const surSoi = ['shield', 'teleportBehind', 'dash', 'summon'].includes(effect.type);
      if (!surSoi) return;
    }
    switch (effect.type) {
      case 'burn':
        if (target) target.burnTimer = Math.max(target.burnTimer, effect.durationMs ?? 3000);
        break;
      case 'freeze':
        if (target) target.frozenTimer = Math.max(target.frozenTimer, effect.durationMs ?? 3000);
        break;
      case 'trap':
        // Cloue la cible sur place : plus aucune entrée n'est lue.
        if (target) {
          target.trappedTimer = Math.max(target.trappedTimer, effect.durationMs ?? 1000);
          target.trapStyle = effect.style ?? 'coagulase';
        }
        break;
      case 'paralyse':
        // La neurotoxine botulique coupe la commande motrice sans immobiliser :
        // la cible marche encore, mais ne peut plus frapper, esquiver ni sauter.
        if (target) target.paralysedTimer = Math.max(target.paralysedTimer, effect.durationMs ?? 2500);
        break;
      case 'poison':
        if (target) target.poisonTimer = Math.max(target.poisonTimer, effect.durationMs ?? 4000);
        break;
      case 'mark':
        // L'aflatoxine ne s'élimine pas : chaque marque majore définitivement
        // les dégâts encaissés. C'est l'exposition chronique, pas l'intoxication
        // aiguë, qui fait le danger réel de la B1.
        if (target) target.marks = Math.min(target.marks + 1, effect.maxStacks ?? 5);
        break;
      case 'summon':
        // Les lactobacilles partent au lancement du coup, pas à la touche :
        // c'est le principe même d'une invocation, elle ne dépend pas de
        // toucher l'adversaire.
        spawnAllies(self, effect.count ?? 1, effect.damage ?? 6);
        break;
      case 'dash':
        // La ruée flagellaire : on se propulse vers l'avant, sans traverser
        // l'adversaire ni sortir du terrain.
        {
          const left = self.camera ? self.camera.leftBound : ARENA_LEFT;
          const right = self.camera ? self.camera.rightBound : ARENA_RIGHT;
          self.x = Math.max(left, Math.min(right, self.x + self.facing * (effect.distance ?? 40)));
        }
        break;
      case 'shield':
        self.shieldTimer = Math.max(self.shieldTimer, effect.durationMs ?? 1000);
        self.selfSlowTimer = Math.max(self.selfSlowTimer, effect.selfSlowMs ?? effect.durationMs ?? 1000);
        break;
      case 'teleportBehind':
        if (target) {
          // On se replace de l'autre côté de l'adversaire, à distance de garde,
          // sans sortir du champ visible.
          const offset = (effect.distance ?? 34) * (self.x <= target.x ? 1 : -1);
          const left = self.camera ? self.camera.leftBound : ARENA_LEFT;
          const right = self.camera ? self.camera.rightBound : ARENA_RIGHT;
          self.x = Math.max(left, Math.min(right, target.x + offset));
        }
        break;
      default:
        break;
    }
  }

  get grounded() {
    return this.y <= 0;
  }

  get isAttacking() {
    return this.state === 'punch' || this.state === 'kick' || this.state === 'superattack';
  }

  setAnimation(name) {
    if (this.animName === name) return;
    this.animName = name;
    this.frameIndex = 0;
    this.frameTimer = 0;
  }

  startAttack(moveName, opponent) {
    const move = this.character.moves[moveName];
    if (!move) return;
    this.state = moveName;
    this.attackName = moveName;
    this.attackHasHit = false;
    this.hitTargets.clear();
    this.gasSpawned = false;
    this.setAnimation(move.animation);
    this.attackElapsed = 0;
    if (moveName === 'superattack') this.energy = 0;
    // Effets qui se déclenchent au lancement du coup, pas à la touche :
    // le biofilm de Listeria et la téléportation par spore de B. cereus.
    if (move.effect && move.effect.on === 'use') {
      Fighter.applyEffect(move.effect, this, opponent);
    }
    playSfx(this.character.sfx?.[moveName]);
  }

  startDodge(opponent) {
    this.state = 'dodge';
    this.actionTimer = DODGE_DURATION_MS;
    this.invincible = true;
    this.vx = -this.facing * DODGE_SPEED;
    this.setAnimation('crouch'); // pose placeholder tant qu'il n'y a pas de sprite dédié
    playSfx(this.character.sfx?.esquive);
    this.x += this.vx;
    this._clampToArena(opponent);
  }

  startTaunt() {
    this.state = 'taunt';
    this.actionTimer = TAUNT_DURATION_MS;
    this.setAnimation('taunt');
    this.energy = Math.min(ENERGY_MAX, this.energy + ENERGY_TAUNT_BONUS);
    playSfx(this.character.sfx?.nargue);
  }

  playVictory() {
    this.state = 'victory';
    this.setAnimation('victory');
  }

  /** Fait avancer uniquement l'animation courante, sans logique de jeu — utilisé
   * pendant les écrans de résultat où le combat est figé mais où l'on veut quand
   * même voir la pose de victoire s'animer. */
  tickAnimationOnly(dt) {
    this._advanceAnimation(dt, true);
  }

  /** Multiplicateur de dégâts du personnage face à un type d'attaque.
   * 0,15 = quasiment insensible, 1,6 = très vulnérable, 1 = neutre.
   * Déclaré dans "resistances" du JSON du perso ; absent = neutre. */
  damageFactor(type) {
    if (!type) return 1;
    return this.character.resistances?.[type] ?? 1;
  }

  /** Majoration due aux marques d'aflatoxine : +10 % par marque, définitif. */
  get markFactor() {
    return 1 + this.marks * MARK_DAMAGE_BONUS;
  }

  /** Encaisse un coup. Renvoie les dégâts réellement infligés (0 si le coup
   * n'est pas passé), ce dont a besoin le vol de vie de C. Fraser. */
  takeHit(move, attackerFacing, attackFactor = 1) {
    if (this.ko) return 0;
    // `pierce` traverse ce qui protège d'ordinaire : les ciseaux CRISPR coupent
    // la cible quel que soit ce qui l'enrobe, biofilm compris. C'est le seul
    // moyen du jeu de toucher L. monocytogenes pendant son biofilm.
    if (!move.pierce && (this.invincible || this.shielded)) return 0;
    // `ignoreResistance` : le barème d'appertisation ne négocie pas. À 121 °C
    // pendant 3 minutes, la thermorésistance des spores ne sert plus à rien,
    // c'est tout l'objet du traitement.
    const resistance = move.ignoreResistance ? 1 : this.damageFactor(move.damageType);
    const damage = Math.round(move.damage * resistance * this.markFactor * attackFactor);
    this.health = Math.max(0, this.health - damage);
    this.hitstunTimer = HITSTUN_MS;
    this.state = 'hurt';
    this.setAnimation('hurt');
    this.vx = attackerFacing * (move.knockback ?? KNOCKBACK);
    if (this.health <= 0) {
      this.ko = true;
      this.state = 'ko';
      this.setAnimation('ko');
      playSfx(this.character.sfx?.ko);
    } else {
      playSfx(this.character.sfx?.hurt);
    }
    return damage;
  }

  update(dt, input, opponent, autresCibles = null) {
    if (!this.ko) {
      this.energy = Math.min(ENERGY_MAX, this.energy + (ENERGY_REGEN_PER_SEC * dt) / 1000);
      this._tickStatuses(dt);
    }

    if (this.ko) {
      this._advanceAnimation(dt, false);
      return;
    }

    // Figé par la coagulase : on continue de subir le temps et les effets, mais
    // aucune entrée n'est lue et le personnage ne bouge plus.
    if (this.trapped && this.hitstunTimer <= 0) {
      this.vx = 0;
      this._applyGravity();
      this._clampToArena(opponent);
      this.facing = opponent.x >= this.x ? 1 : -1;
      if (this.state !== 'hurt') {
        this.state = this.grounded ? 'idle' : 'jump';
        this.setAnimation(this.state);
      }
      this._advanceAnimation(dt, true);
      return;
    }

    if (this.hitstunTimer > 0) {
      this.hitstunTimer -= dt;
      this.x += this.vx;
      this.vx *= 0.85;
      this._clampToArena(opponent);
      this._advanceAnimation(dt, false);
      if (this.hitstunTimer <= 0) {
        this.state = 'idle';
        this.setAnimation('idle');
      }
      return;
    }

    if (this.isAttacking) {
      this.attackElapsed += dt;
      // Poing puis Pied (ou l'inverse) à quelques dizaines de millisecondes
      // d'intervalle déclenche la super attaque : le coup simple qui vient de
      // partir est annulé et remplacé. C'est ce qui rend la super jouable à la
      // main — sinon il faudrait presser les deux touches dans la même frame.
      if (this.energy >= ENERGY_MAX && this.character.moves.superattack &&
          (this.state === 'punch' || this.state === 'kick') &&
          this.attackElapsed <= SUPER_INPUT_WINDOW_MS && !this.attackHasHit) {
        const other = this.state === 'punch' ? 'kick' : 'punch';
        if (input.justPressed(this.playerIndex, other)) {
          this.startAttack('superattack', opponent);
          return;
        }
      }
      this._resolveAttackHit(opponent, autresCibles);
      const finished = this._advanceAnimation(dt, false);
      this._applyGravity();
      this._clampToArena(opponent);
      if (finished) {
        this.state = this.grounded ? 'idle' : 'jump';
        this.setAnimation(this.state);
      }
      return;
    }

    if (this.state === 'dodge') {
      this.actionTimer -= dt;
      this.x += this.vx;
      this.vx *= 0.8;
      this._clampToArena(opponent);
      if (this.actionTimer <= 0) {
        this.invincible = false;
        this.state = 'idle';
        this.setAnimation('idle');
      }
      return;
    }

    if (this.state === 'taunt') {
      this.actionTimer -= dt;
      this._advanceAnimation(dt, true);
      if (this.actionTimer <= 0) {
        this.state = 'idle';
        this.setAnimation('idle');
      }
      return;
    }

    // Se tourne vers l'adversaire
    this.facing = opponent.x >= this.x ? 1 : -1;

    // Paralysie flasque : les jambes répondent encore, plus rien d'autre. Le
    // joueur garde la marche et l'accroupissement, mais perd les coups, le saut,
    // l'esquive et la narguerie. C'est un effet de contrôle, pas d'immobilisation.
    const peutAgir = !this.paralysed;

    const superReady = peutAgir && this.character.moves.superattack && this.energy >= ENERGY_MAX && (
      (input.justPressed(this.playerIndex, 'punch') && input.isDown(this.playerIndex, 'kick')) ||
      (input.justPressed(this.playerIndex, 'kick') && input.isDown(this.playerIndex, 'punch'))
    );
    if (this.grounded && superReady) {
      this.startAttack('superattack', opponent);
      return;
    }

    if (peutAgir && input.justPressed(this.playerIndex, 'punch')) {
      this.startAttack('punch', opponent);
      return;
    }
    if (peutAgir && input.justPressed(this.playerIndex, 'kick')) {
      this.startAttack('kick', opponent);
      return;
    }
    if (peutAgir && this.grounded && input.justPressed(this.playerIndex, 'dodge')) {
      this.startDodge(opponent);
      return;
    }
    if (peutAgir && this.grounded && input.justPressed(this.playerIndex, 'taunt')) {
      this.startTaunt();
      return;
    }

    const left = input.isDown(this.playerIndex, 'left');
    const right = input.isDown(this.playerIndex, 'right');
    const down = input.isDown(this.playerIndex, 'down');

    if (peutAgir && this.grounded && input.justPressed(this.playerIndex, 'up')) {
      this.vy = this.character.jumpVelocity ?? JUMP_VELOCITY;
      this.vx = (left ? -1 : right ? 1 : 0) * this._moveSpeed();
      this.state = 'jump';
      this.setAnimation('jump');
      playSfx(this.character.sfx?.jump);
      this.x += this.vx;
      this._applyGravity();
      this._clampToArena(opponent);
      this._advanceAnimation(dt, true);
      return;
    }

    if (this.grounded) {
      if (down) {
        this.vx = 0;
        this.state = 'crouch';
        this.setAnimation('crouch');
      } else if (left || right) {
        this.vx = (left ? -1 : 1) * this._moveSpeed();
        this.state = 'walk';
        this.setAnimation('walk');
      } else {
        this.vx = 0;
        this.state = 'idle';
        this.setAnimation('idle');
      }
    } else {
      this.vx = (left ? -1 : right ? 1 : 0) * this._moveSpeed();
      this.setAnimation('jump');
    }

    this.x += this.vx;
    this._applyGravity();
    this._clampToArena(opponent);
    this._advanceAnimation(dt, true);
  }

  _applyGravity() {
    if (this.y > 0 || this.vy !== 0) {
      this.y += this.vy;
      this.vy -= GRAVITY;
      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        if (this.state === 'jump') {
          this.state = 'idle';
          this.setAnimation('idle');
        }
      }
    }
  }

  _moveSpeed() {
    const base = this.character.moveSpeed ?? MOVE_SPEED;
    return this.slowed ? base * SLOW_FACTOR : base;
  }

  _bodyWidth() {
    return (this.character.hurtbox?.width ?? DEFAULT_BODY_WIDTH) * this.sizeFactor;
  }

  _clampToArena(opponent) {
    // Bornes fournies par la caméra sur un décor panoramique : le combattant ne
    // peut pas sortir de l'écran, mais l'écran, lui, se déplace dans le décor.
    // Sans caméra (décor de la largeur de l'écran), on retombe sur les bornes fixes.
    const left = this.camera ? this.camera.leftBound : ARENA_LEFT;
    const right = this.camera ? this.camera.rightBound : ARENA_RIGHT;
    this.x = Math.max(left, Math.min(right, this.x));

    // Dès que l'un des deux est en l'air assez haut, il survole l'autre : on
    // lève la séparation des corps, ce qui permet de sauter par-dessus
    // l'adversaire et d'atterrir de l'autre côté. Ils continuent de se faire
    // face, `facing` étant recalculé à chaque frame.
    const crossing = this.y > CROSS_OVER_HEIGHT || opponent.y > CROSS_OVER_HEIGHT;
    if (crossing) return;

    const minSep = Math.max(MIN_SEPARATION, (this._bodyWidth() + opponent._bodyWidth()) / 2 + 4);
    const dist = Math.abs(this.x - opponent.x);
    if (dist < minSep) {
      const push = (minSep - dist) * (this.x < opponent.x ? -1 : 1);
      this.x += push;
    }
  }

  /** Avance l'animation courante ; renvoie true si une animation non bouclée vient de se terminer */
  _advanceAnimation(dt, loopFallbackToIdle) {
    const anim = this.character.animations[this.animName];
    if (!anim) return false;
    this.frameTimer += dt;
    if (this.frameTimer >= anim.frameDuration) {
      this.frameTimer -= anim.frameDuration;
      this.frameIndex++;
      if (this.frameIndex >= anim.frames.length) {
        if (anim.loop) {
          this.frameIndex = 0;
        } else {
          this.frameIndex = anim.frames.length - 1;
          return true;
        }
      }
    }
    return false;
  }

  _resolveAttackHit(opponent, autresCibles = null) {
    const move = this.character.moves[this.attackName];
    // Un coup sans hitbox est purement défensif (le biofilm de Listeria) :
    // il ne cherche jamais à toucher, son seul effet est posé au lancement.
    if (!move || !move.activeFrames || !move.hitbox?.width) return;
    const [start, end] = move.activeFrames;
    if (this.frameIndex < start || this.frameIndex > end) return;

    const box = this.getHitbox(move);

    // La nappe part dès la frame active, qu'on touche ou non : un jet de gaz
    // qui ne sortirait qu'en cas de contact n'aurait aucun sens.
    if (move.effect?.type === 'poison' && !this.gasSpawned) {
      this.gasSpawned = true;
      spawnGasCloud(box.x + box.w / 2, box.y + box.h / 2, this.facing);
    }

    const cibles = autresCibles && autresCibles.length
      ? [opponent, ...autresCibles]
      : [opponent];
    for (const cible of cibles) {
      if (!cible || cible === this || this.hitTargets.has(cible)) continue;
      this._tenterDeToucher(move, box, cible);
    }
  }

  /** Confronte la hitbox du coup en cours à UNE cible et applique tout ce qui
   * en découle. Extrait de _resolveAttackHit pour que le même code serve à un
   * adversaire unique comme à une vague entière. */
  _tenterDeToucher(move, box, opponent) {
    const hurt = opponent.getHurtbox();
    if (!rectsOverlap(box, hurt)) return;
    // Un adversaire en esquive, protégé par un biofilm ou déjà K.O. n'encaisse
    // ni le coup ni son effet : on relit son état avant de trancher.
    const protege = opponent.invincible || opponent.shielded;
    const connected = !opponent.ko && (move.pierce || !protege);
    const inflige = opponent.takeHit(move, this.facing, this.attackFactor);
    this.attackHasHit = true;
    this.hitTargets.add(opponent);

    // Vol de vie : C. Fraser aspire l'ADN de l'adversaire et s'en nourrit.
    // Proportionnel aux dégâts RÉELLEMENT infligés, donc nul sur un coup qui
    // n'est pas passé et réduit quand la cible résiste — sans quoi elle se
    // soignerait à plein tarif en tapant dans un mur.
    if (inflige > 0 && move.effect?.type === 'drain') {
      const rendu = Math.round(inflige * (move.effect.ratio ?? 0.5));
      this.health = Math.min(this.maxHealth, this.health + rendu);
    }
    if (connected && move.effect && move.effect.on !== 'use') {
      Fighter.applyEffect(move.effect, this, opponent);
    }
    const cx = (Math.max(box.x, hurt.x) + Math.min(box.x + box.w, hurt.x + hurt.w)) / 2;
    const cy = (Math.max(box.y, hurt.y) + Math.min(box.y + box.h, hurt.y + hurt.h)) / 2;
    spawnHitEffect(cx, cy, move.damage >= 15, this.character.hitEffectTheme);
  }

  getHitbox(move) {
    const hb = move.hitbox;
    const k = this.sizeFactor;
    const cx = this.x + this.facing * hb.offsetX * k;
    const cy = FLOOR_Y - this.y - hb.offsetY * k;
    const w = hb.width * k;
    const h = hb.height * k;
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  }

  getHurtbox() {
    const hb = this.character.hurtbox;
    const k = this.sizeFactor;
    const w = (hb?.width ?? DEFAULT_BODY_WIDTH) * k;
    const h = (this.state === 'crouch'
      ? hb?.heightCrouch ?? DEFAULT_BODY_HEIGHT_CROUCH
      : hb?.heightStand ?? DEFAULT_BODY_HEIGHT_STAND) * k;
    const cy = FLOOR_Y - this.y - h / 2;
    return { x: this.x - w / 2, y: cy - h / 2, w, h };
  }

  draw(ctx) {
    const anim = this.character.animations[this.animName];
    const frame = anim?.frames?.[this.frameIndex];
    const scale = this.character.scale * this.sizeFactor;
    const drawY = FLOOR_Y - this.y;

    ctx.save();
    ctx.translate(this.x, drawY);
    ctx.scale(this.facing * scale, scale);

    if (frame) {
      ctx.imageSmoothingEnabled = false;
      // groundY de l'animation en priorité, puis celui du personnage : les
      // animations et la pose de repos n'ont pas forcément la même ligne de sol.
      const groundY = anim.groundY ?? this.character.groundY ?? frame.height;
      ctx.drawImage(frame, -frame.width / 2, -groundY);

      // Un combattant brûlé, gelé ou protégé par un biofilm est recouvert d'une
      // teinte de sa couleur d'état — c'est la seule lecture que le joueur a de
      // ces effets pendant l'action.
      const tint = this._statusTint();
      if (tint) {
        ctx.globalAlpha = tint.alpha;
        ctx.drawImage(tintedFrame(frame, tint.color), -frame.width / 2, -groundY);
        ctx.globalAlpha = 1;
      }
    } else {
      // Placeholder tant qu'il n'y a pas de sprite pour cette animation
      const hb = this.character.hurtbox;
      const bodyH = this.state === 'crouch'
        ? hb?.heightCrouch ?? DEFAULT_BODY_HEIGHT_CROUCH
        : hb?.heightStand ?? DEFAULT_BODY_HEIGHT_STAND;
      const h = bodyH / scale;
      const w = (hb?.width ?? DEFAULT_BODY_WIDTH) / scale;
      ctx.fillStyle = this.character.color;
      ctx.fillRect(-w / 2, -h, w, h);
      ctx.fillStyle = '#000';
      ctx.font = '6px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.scale(this.facing, 1); // texte lisible même si le perso regarde à gauche
      ctx.fillText(this.animName, 0, -h - 2);
    }
    ctx.restore();

    // Le cube de plasma coagulé se dessine APRÈS le personnage et hors de son
    // repère mis à l'échelle : c'est une boîte en coordonnées du canvas, calée
    // sur la hurtbox, pas un élément du sprite.
    if (this.trapped) this._drawTrapCube(ctx);
  }

  _drawTrapCube(ctx) {
    const style = TRAP_CUBES[this.trapStyle] ?? TRAP_CUBES.coagulase;
    const hb = this.getHurtbox();
    const p = style.padding;
    const x = Math.round(hb.x - p);
    const y = Math.round(hb.y - p);
    const w = Math.round(hb.w + p * 2);
    const h = Math.round(hb.h + p * 2);
    const d = Math.round(p * 1.2); // profondeur de la face du dessus, pour le relief

    ctx.save();
    ctx.fillStyle = style.fill;
    ctx.fillRect(x, y, w, h);
    // Face supérieure en biais : suffit à faire lire un volume plutôt qu'un carré.
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + d, y - d);
    ctx.lineTo(x + w + d, y - d);
    ctx.lineTo(x + w, y);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w + d, y - d);
    ctx.lineTo(x + w + d, y + h - d);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = style.edge;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.beginPath();
    ctx.moveTo(x + 0.5, y + 0.5); ctx.lineTo(x + d + 0.5, y - d + 0.5);
    ctx.moveTo(x + w - 0.5, y + 0.5); ctx.lineTo(x + w + d - 0.5, y - d + 0.5);
    ctx.moveTo(x + w - 0.5, y + h - 0.5); ctx.lineTo(x + w + d - 0.5, y + h - d - 0.5);
    ctx.moveTo(x + d + 0.5, y - d + 0.5); ctx.lineTo(x + w + d - 0.5, y - d + 0.5);
    ctx.moveTo(x + w + d - 0.5, y - d + 0.5); ctx.lineTo(x + w + d - 0.5, y + h - d - 0.5);
    ctx.stroke();
    ctx.restore();
  }
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
