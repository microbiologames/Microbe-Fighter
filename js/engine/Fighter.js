import {
  FLOOR_Y, ARENA_LEFT, ARENA_RIGHT, GRAVITY, JUMP_VELOCITY, MOVE_SPEED,
  MAX_HEALTH, HITSTUN_MS, KNOCKBACK, DODGE_DURATION_MS, DODGE_SPEED, TAUNT_DURATION_MS,
  ENERGY_MAX, ENERGY_REGEN_PER_SEC, ENERGY_TAUNT_BONUS,
} from './Config.js';
import { spawnHitEffect } from './Effects.js';
import { playSfx } from './Audio.js';

// Valeurs par défaut si le perso ne définit pas son propre "hurtbox" dans son JSON.
const DEFAULT_BODY_WIDTH = 20;
const DEFAULT_BODY_HEIGHT_STAND = 48;
const DEFAULT_BODY_HEIGHT_CROUCH = 32;
const MIN_SEPARATION = 24;

export class Fighter {
  constructor(character, playerIndex, startX, facing) {
    this.character = character;
    this.playerIndex = playerIndex;
    this.x = startX;
    this.y = 0; // hauteur au-dessus du sol (0 = au sol), augmente vers le haut
    this.vx = 0;
    this.vy = 0;
    this.facing = facing; // 1 = vers la droite, -1 = vers la gauche

    this.health = MAX_HEALTH;
    this.state = 'idle';
    this.animName = 'idle';
    this.frameIndex = 0;
    this.frameTimer = 0;

    this.hitstunTimer = 0;
    this.attackName = null;
    this.attackHasHit = false;
    this.ko = false;
    this.winner = false;

    this.invincible = false;
    this.actionTimer = 0;
    this.energy = 0;
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

  startAttack(moveName) {
    const move = this.character.moves[moveName];
    if (!move) return;
    this.state = moveName;
    this.attackName = moveName;
    this.attackHasHit = false;
    this.setAnimation(move.animation);
    if (moveName === 'superattack') this.energy = 0;
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

  takeHit(move, attackerFacing) {
    if (this.ko || this.invincible) return;
    this.health = Math.max(0, this.health - move.damage);
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
  }

  update(dt, input, opponent) {
    if (!this.ko) {
      this.energy = Math.min(ENERGY_MAX, this.energy + (ENERGY_REGEN_PER_SEC * dt) / 1000);
    }

    if (this.ko) {
      this._advanceAnimation(dt, false);
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
      this._resolveAttackHit(opponent);
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

    const superReady = this.character.moves.superattack && this.energy >= ENERGY_MAX && (
      (input.justPressed(this.playerIndex, 'punch') && input.isDown(this.playerIndex, 'kick')) ||
      (input.justPressed(this.playerIndex, 'kick') && input.isDown(this.playerIndex, 'punch'))
    );
    if (this.grounded && superReady) {
      this.startAttack('superattack');
      return;
    }

    if (input.justPressed(this.playerIndex, 'punch')) {
      this.startAttack('punch');
      return;
    }
    if (input.justPressed(this.playerIndex, 'kick')) {
      this.startAttack('kick');
      return;
    }
    if (this.grounded && input.justPressed(this.playerIndex, 'dodge')) {
      this.startDodge(opponent);
      return;
    }
    if (this.grounded && input.justPressed(this.playerIndex, 'taunt')) {
      this.startTaunt();
      return;
    }

    const left = input.isDown(this.playerIndex, 'left');
    const right = input.isDown(this.playerIndex, 'right');
    const down = input.isDown(this.playerIndex, 'down');

    if (this.grounded && input.justPressed(this.playerIndex, 'up')) {
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
    return this.character.moveSpeed ?? MOVE_SPEED;
  }

  _bodyWidth() {
    return this.character.hurtbox?.width ?? DEFAULT_BODY_WIDTH;
  }

  _clampToArena(opponent) {
    this.x = Math.max(ARENA_LEFT, Math.min(ARENA_RIGHT, this.x));
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

  _resolveAttackHit(opponent) {
    if (this.attackHasHit) return;
    const move = this.character.moves[this.attackName];
    if (!move || !move.activeFrames) return;
    const [start, end] = move.activeFrames;
    if (this.frameIndex < start || this.frameIndex > end) return;

    const box = this.getHitbox(move);
    const hurt = opponent.getHurtbox();
    if (rectsOverlap(box, hurt)) {
      opponent.takeHit(move, this.facing);
      this.attackHasHit = true;
      const cx = (Math.max(box.x, hurt.x) + Math.min(box.x + box.w, hurt.x + hurt.w)) / 2;
      const cy = (Math.max(box.y, hurt.y) + Math.min(box.y + box.h, hurt.y + hurt.h)) / 2;
      spawnHitEffect(cx, cy, move.damage >= 15, this.character.hitEffectTheme);
    }
  }

  getHitbox(move) {
    const hb = move.hitbox;
    const cx = this.x + this.facing * hb.offsetX;
    const cy = FLOOR_Y - this.y - hb.offsetY;
    return { x: cx - hb.width / 2, y: cy - hb.height / 2, w: hb.width, h: hb.height };
  }

  getHurtbox() {
    const hb = this.character.hurtbox;
    const w = hb?.width ?? DEFAULT_BODY_WIDTH;
    const h = this.state === 'crouch'
      ? hb?.heightCrouch ?? DEFAULT_BODY_HEIGHT_CROUCH
      : hb?.heightStand ?? DEFAULT_BODY_HEIGHT_STAND;
    const cy = FLOOR_Y - this.y - h / 2;
    return { x: this.x - w / 2, y: cy - h / 2, w, h };
  }

  draw(ctx) {
    const anim = this.character.animations[this.animName];
    const frame = anim?.frames?.[this.frameIndex];
    const scale = this.character.scale;
    const drawY = FLOOR_Y - this.y;

    ctx.save();
    ctx.translate(this.x, drawY);
    ctx.scale(this.facing * scale, scale);

    if (frame) {
      ctx.imageSmoothingEnabled = false;
      const groundY = this.character.groundY ?? frame.height;
      ctx.drawImage(frame, -frame.width / 2, -groundY);
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
  }
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
