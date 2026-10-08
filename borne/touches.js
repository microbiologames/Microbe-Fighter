/* ---------------------------------------------------------------------------
   Releve des commandes de la borne. On ne devine pas ce qu'envoie un
   encodeur USB : on le lui demande, bouton par bouton.

   Deux lectures en parallele :
     - un ASSISTANT qui demande un geste a la fois et note ce qui arrive ;
     - une GRILLE vivante de tous les boutons et de tous les axes, pour lire
       un index au vol sans suivre l'assistant.

   Le resultat est un objet JSON a recopier dans borne/manette.js (lanceur et
   Microbe Fighter) et dans src/core/input.js de Cell Dungeon. Il est garde
   en localStorage : un rafraichissement malencontreux ne perd pas le releve.
--------------------------------------------------------------------------- */

const $ = (id) => document.getElementById(id);

/* Les gestes a relever, dans l'ordre. Deux joueurs, parce que le geste de
   Cell Dungeon veut les DEUX joysticks.
   Le BLANC est demande en premier des boutons : c'est lui qui porte le geste
   de retour au menu depuis qu'on sait que ce meuble n'a ni START ni SELECT
   (releve du 18/08/2026). START et SELECT restent dans la liste pour
   CONFIRMER leur absence sur place ; un bouton qui n'existe pas ne bloque
   pas, la liste avance apres PATIENCE_MS. */
const ETAPES = [
  ['j1.droite', 'JOUEUR 1 : POUSSE LE JOYSTICK A DROITE', 'axe'],
  ['j1.bas', 'JOUEUR 1 : POUSSE LE JOYSTICK VERS LE BAS', 'axe'],
  ['j1.poing', 'JOUEUR 1 : BOUTON POING', 'bouton'],
  ['j1.pied', 'JOUEUR 1 : BOUTON PIED', 'bouton'],
  ['j1.esquive', 'JOUEUR 1 : BOUTON ESQUIVE (s\'il existe)', 'bouton'],
  ['j1.narguer', 'JOUEUR 1 : BOUTON NARGUER (s\'il existe)', 'bouton'],
  ['j1.blanc', 'JOUEUR 1 : BOUTON BLANC (Z) \u2014 LE RETOUR AU MENU', 'bouton'],
  ['j1.start', 'JOUEUR 1 : BOUTON START (s\'il existe)', 'bouton'],
  ['j1.select', 'JOUEUR 1 : BOUTON SELECT / COIN (s\'il existe)', 'bouton'],
  ['j2.droite', 'JOUEUR 2 : POUSSE LE JOYSTICK A DROITE', 'axe'],
  ['j2.bas', 'JOUEUR 2 : POUSSE LE JOYSTICK VERS LE BAS', 'axe'],
  ['j2.poing', 'JOUEUR 2 : BOUTON POING', 'bouton'],
  ['j2.pied', 'JOUEUR 2 : BOUTON PIED', 'bouton'],
  ['j2.blanc', 'JOUEUR 2 : BOUTON BLANC (Z) \u2014 LE RETOUR AU MENU', 'bouton'],
  ['j2.centre', 'JOUEUR 2 : BOUTON CENTRAL HOME / PAUSE (s\'il existe)', 'bouton'],
  ['j2.start', 'JOUEUR 2 : BOUTON START (s\'il existe)', 'bouton'],
];

/* Silence au bout duquel on passe au geste suivant : un bouton qui n'existe
   pas ne doit pas bloquer le releve, et personne n'a de clavier sous la main
   pour passer. 8 s, le temps de lire la consigne et de constater qu'aucun
   bouton n'y correspond. */
const PATIENCE_MS = 8000;
const SEUIL_AXE = 0.5;

const CLE = 'borne-releve';
let releve = {};
try { releve = JSON.parse(localStorage.getItem(CLE) || '{}'); } catch { releve = {}; }

let etape = 0;
let depuis = performance.now();
let demarre = false;
const vus = new Set();        // "pad:bouton" deja presses au moins une fois
let prev = new Map();         // etat precedent des boutons, par manette
let repos = new Map();        // valeur des axes au repos, par manette

function afficherReleve() {
  $('releve').textContent = JSON.stringify(releve, null, 2);
  try { localStorage.setItem(CLE, JSON.stringify(releve)); } catch { /* mode prive */ }
}

function noter(cle, valeur) {
  releve[cle] = valeur;
  afficherReleve();
  $('capture').textContent = `relevé : ${cle} = ${JSON.stringify(valeur)}`;
  etape++;
  depuis = performance.now();
}

function majConsigne() {
  if (!demarre) return;
  if (etape >= ETAPES.length) {
    $('consigne').textContent = 'RELEVÉ TERMINÉ';
    $('avancement').textContent = 'Le bloc de droite est le résultat. La grille reste vivante pour vérifier au vol.';
    return;
  }
  const [, texte] = ETAPES[etape];
  const reste = Math.max(0, PATIENCE_MS - (performance.now() - depuis));
  $('consigne').textContent = texte;
  $('avancement').textContent =
    `geste ${etape + 1} / ${ETAPES.length} — rien dans ${(reste / 1000).toFixed(0)} s : on passe`;
  if (reste <= 0) { releve[ETAPES[etape][0]] = null; afficherReleve(); etape++; depuis = performance.now(); }
}

/* --- Grille vivante ------------------------------------------------------ */

const blocs = new Map();

function blocPour(pad) {
  let bloc = blocs.get(pad.index);
  if (bloc) return bloc;
  if (!blocs.size) $('pads').innerHTML = '';
  const el = document.createElement('div');
  el.className = 'pad';
  el.innerHTML = `<div class="nom"></div><div class="boutons"></div><div class="axes"></div>`;
  el.querySelector('.nom').textContent = `manette ${pad.index} — ${pad.id}`;
  $('pads').appendChild(el);
  bloc = { el, boutons: [], axes: el.querySelector('.axes') };
  for (const [i] of pad.buttons.entries()) {
    const b = document.createElement('div');
    b.className = 'b';
    b.textContent = String(i);
    el.querySelector('.boutons').appendChild(b);
    bloc.boutons.push(b);
  }
  blocs.set(pad.index, bloc);
  return bloc;
}

function tour() {
  const pads = Array.from(navigator.getGamepads?.() || []);
  for (const pad of pads) {
    if (!pad) continue;
    const bloc = blocPour(pad);
    const avant = prev.get(pad.index) || [];
    const maintenant = pad.buttons.map((b) => !!b.pressed);

    /* Les axes au repos sont releves a la PREMIERE lecture de la manette :
       c'est cette valeur qui dit si une zone morte est necessaire, et
       combien. Un encodeur tout-ou-rien rend 0 ; une manette analogique
       fatiguee rend quelques centiemes. */
    if (!repos.has(pad.index)) repos.set(pad.index, pad.axes.map((v) => v));
    const r = repos.get(pad.index);

    for (const [i, on] of maintenant.entries()) {
      bloc.boutons[i].classList.toggle('on', on);
      if (on && !avant[i]) {
        vus.add(`${pad.index}:${i}`);
        bloc.boutons[i].classList.add('vu');
        if (!demarre) { demarre = true; depuis = performance.now(); }
        else if (etape < ETAPES.length && ETAPES[etape][2] === 'bouton') {
          noter(ETAPES[etape][0], { manette: pad.index, bouton: i });
        }
      }
    }
    prev.set(pad.index, maintenant);

    bloc.axes.innerHTML = pad.axes.map((v, i) => {
      const dort = Math.abs(r[i]) > 0.08;
      return `<div>axe ${i} : <b>${v.toFixed(3)}</b>`
        + (dort ? ` <span class="repos">repos ${r[i].toFixed(3)}</span>` : '')
        + '</div>';
    }).join('');

    if (demarre && etape < ETAPES.length && ETAPES[etape][2] === 'axe') {
      const i = pad.axes.findIndex((v, k) => Math.abs(v - r[k]) > SEUIL_AXE);
      if (i >= 0) {
        noter(ETAPES[etape][0], { manette: pad.index, axe: i, signe: Math.sign(pad.axes[i] - r[i]) });
      } else {
        /* Une croix directionnelle n'a pas d'axe : elle sort en boutons. */
        for (const nom of [12, 13, 14, 15]) {
          if (pad.buttons[nom]?.pressed) {
            noter(ETAPES[etape][0], { manette: pad.index, bouton: nom, croix: true });
            break;
          }
        }
      }
    }
  }
  if (!demarre && pads.some(Boolean)) {
    /* La manette est la mais rien n'a encore ete presse : Chromium ne la
       declare qu'au premier appui, donc ce cas est bref. */
    $('consigne').textContent = 'APPUIE SUR UN BOUTON POUR COMMENCER';
  }
  majConsigne();
  requestAnimationFrame(tour);
}

/* Le clavier est releve aussi : un encodeur peut etre configure en mode
   clavier, et la page doit le dire plutot que de rester muette. */
const touches = [];
addEventListener('keydown', (e) => {
  if (e.repeat) return;
  touches.unshift(e.code);
  touches.length = Math.min(touches.length, 12);
  $('clavier').textContent = touches.join('  ·  ');
  releve.clavier = [...new Set(touches)];
  afficherReleve();
});

afficherReleve();
requestAnimationFrame(tour);
