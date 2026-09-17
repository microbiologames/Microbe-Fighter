// Les lactobacilles d'É. Metchnikoff : de petits alliés autonomes qu'un coup
// lâche sur le terrain et qui vont mordre l'adversaire tout seuls.
//
// C'est le seul endroit du moteur où quelque chose agit sans qu'un joueur
// appuie sur une touche. Volontairement minimal : un allié n'a pas d'état, pas
// de sprite et pas de hurtbox. Il fonce vers sa cible, la mord une fois, et
// disparaît. Lui donner une vraie IA aurait demandé un deuxième Fighter, pour
// un gain de jeu nul — ce qui compte est qu'ils occupent l'adversaire pendant
// que Metchnikoff, qui frappe faiblement, reprend la main.
//
// Metchnikoff n'est nommé nulle part ici : n'importe quel coup portant un effet
// `summon` en lâche, donc un futur perso à invocations marchera sans code neuf.

import { FLOOR_Y } from './Config.js';

const SPEED = 1.9;           // px par frame de 16 ms
const LIFETIME_MS = 4000;    // au-delà, ils se dissipent même sans avoir mordu
const BITE_RANGE = 14;       // distance à laquelle la morsure part
const BODY = 7;              // rayon dessiné

const allies = [];

export function clearAllies() {
  allies.length = 0;
}

/** Lâche `count` lactobacilles devant leur invocateur. */
export function spawnAllies(owner, count, damage) {
  for (let i = 0; i < count; i++) {
    allies.push({
      owner,
      damage,
      // Ils sortent du bol, donc à hauteur de poitrine, et en éventail : sans
      // ce décalage les quatre du coup spécial se superposent exactement et on
      // n'en voit qu'un.
      x: owner.x + owner.facing * (10 + i * 7),
      y: 26 + (i % 2) * 9,
      vy: 0,
      age: 0,
      wobble: Math.random() * Math.PI * 2,
      spent: false,
    });
  }
}

export function updateAllies(dt, fighters) {
  for (let i = allies.length - 1; i >= 0; i--) {
    const a = allies[i];
    a.age += dt;
    if (a.age >= LIFETIME_MS || a.spent) { allies.splice(i, 1); continue; }

    // La cible est celui qui n'est pas l'invocateur, et elle est relue à chaque
    // frame : si l'adversaire recule ou saute, le lactobacille le suit.
    const target = fighters.find((f) => f !== a.owner);
    if (!target || target.ko) { allies.splice(i, 1); continue; }

    const dx = target.x - a.x;
    const dir = Math.sign(dx) || 1;
    a.x += dir * SPEED * (dt / 16);

    // Un flottement vertical, pour qu'ils ne glissent pas comme sur un rail.
    a.wobble += dt / 90;
    a.y += Math.sin(a.wobble) * 0.4;
    a.y = Math.max(10, Math.min(70, a.y));

    if (Math.abs(dx) <= BITE_RANGE) {
      // Une morsure compte comme un coup ordinaire : elle passe par takeHit,
      // donc les résistances, les marques d'aflatoxine et le biofilm
      // s'appliquent exactement comme pour un coup de poing.
      target.takeHit({ damage: a.damage, damageType: 'physique', knockback: 1 }, dir);
      a.spent = true;
    }
  }
}

export function drawAllies(ctx) {
  for (const a of allies) {
    const x = Math.round(a.x);
    const y = Math.round(FLOOR_Y - a.y);
    // Fondu sur la dernière demi-seconde de vie, sinon ils disparaissent d'un
    // coup et on croit à un bug d'affichage.
    const reste = LIFETIME_MS - a.age;
    ctx.save();
    ctx.globalAlpha = reste < 500 ? reste / 500 : 1;

    // Un bâtonnet crème : c'est un lactobacille, pas une bille.
    ctx.fillStyle = '#f2e7cf';
    ctx.fillRect(x - BODY, y - 3, BODY * 2, 6);
    ctx.fillStyle = '#d8c7a0';
    ctx.fillRect(x - BODY, y + 1, BODY * 2, 2);
    // Deux yeux, du côté où il avance.
    ctx.fillStyle = '#2b2b2b';
    const av = x + (a.owner ? a.owner.facing * 3 : 3);
    ctx.fillRect(av, y - 2, 1, 2);
    ctx.fillRect(av + 3, y - 2, 1, 2);
    ctx.restore();
  }
}
