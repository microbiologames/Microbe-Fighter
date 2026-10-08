/* ---------------------------------------------------------------------------
   Le menu de la borne : deux jeux, les memes boutons, et un geste pour
   revenir ici.

   Les jeux tournent dans une IFRAME de cette page, pas en navigation : c'est
   ce qui permet de les ARRETER net en retirant l'iframe. Un jeu quitte par
   navigation laisse derriere lui son contexte audio et sa boucle d'images
   tant que le navigateur n'a pas recycle la page ; sur une borne qui tourne
   six heures d'affilee, ca s'entend.

   Meme origine obligatoire (voir serveur.js) : c'est a cette condition que
   le menu peut lire le clavier et les manettes du jeu qu'il heberge, donc
   reconnaitre le geste de retour sans que le jeu ait a y participer. Aucun
   des deux jeux ne contient une seule ligne pour cette borne.
--------------------------------------------------------------------------- */

import { Commandes, COMBO_MS } from './manette.js';

const $ = (id) => document.getElementById(id);
const menu = $('menu');
const jauge = $('jauge');
const barre = $('barre');

const conf = await fetch('jeux.json').then((r) => r.json());
if (conf.titre) $('titre').textContent = conf.titre;
$('evenement').textContent = conf.evenement || '';

/* Retour au menu apres inactivite. Un jour d'exposition, un joueur part au
   milieu d'une partie : sans ce repli la borne reste bloquee sur un ecran de
   jeu mort et le suivant croit qu'elle est en panne. 0 desactive.
   ?inactif=<secondes> dans l'URL court-circuite la valeur de jeux.json :
   c'est ce qui permet de l'essayer en dix secondes au lieu de trois minutes,
   sur la borne comme au banc. */
const PARAMS = new URLSearchParams(location.search);
const INACTIF_MS = (Number(PARAMS.get('inactif')) || conf.retourInactif || 0) * 1000;

const cmd = new Commandes();
let choix = 0;
let jeuEnCours = null;   // { def, frame }

/* --- Les tuiles ---------------------------------------------------------- */

const tuiles = conf.jeux.map((def) => {
  const el = document.createElement('div');
  el.className = 'tuile';
  el.innerHTML = `
    <div class="image"></div>
    <div class="texte">
      <h2></h2>
      <p class="sous"></p>
      <p class="commandes"></p>
    </div>`;
  el.querySelector('.image').style.backgroundImage = `url("${def.vignette}")`;
  el.querySelector('h2').textContent = def.titre;
  el.querySelector('.sous').textContent = def.sous || '';
  el.querySelector('.commandes').textContent = def.commandes || '';
  $('tuiles').appendChild(el);
  return { def, el, present: true };
});

/* Un jeu absent du disque se voit DANS le menu, barre, au lieu d'ouvrir une
   iframe vide le jour de l'exposition. C'est la page qu'on livre qui repond,
   pas la configuration qu'on espere. */
await Promise.all(tuiles.map(async (t) => {
  /* Le serveur a deja dit ce qu'il a monte ; la requete HEAD verifie la
     chaine ENTIERE — route, droits, fichier reellement servi. Le depot a
     deja ete vert pendant que la page livree ne construisait plus rien. */
  try {
    const r = await fetch(t.def.url, { method: 'HEAD' });
    t.present = t.def.present !== false && r.ok;
  } catch { t.present = false; }
  t.el.classList.toggle('absent', !t.present);
}));

function designer(i) {
  const n = tuiles.length;
  choix = ((i % n) + n) % n;
  tuiles.forEach((t, k) => t.el.classList.toggle('sel', k === choix));
}
designer(tuiles.findIndex((t) => t.present) < 0 ? 0 : tuiles.findIndex((t) => t.present));

/* --- Lancer, revenir ----------------------------------------------------- */

function lancer(t) {
  if (!t || !t.present || jeuEnCours) return;
  const frame = document.createElement('iframe');
  /* gamepad et autoplay sont deja autorises pour une iframe de meme origine ;
     on les declare pour que la regle soit lisible ici, et pour survivre a un
     durcissement par defaut du navigateur. */
  frame.setAttribute('allow', 'autoplay; gamepad; fullscreen');
  frame.src = t.def.url;
  frame.addEventListener('load', () => {
    /* Le focus part a l'iframe : c'est elle qui doit recevoir le clavier, et
       c'est son document que Chromium sert en etat de manettes. */
    try {
      cmd.ecouterFenetre(frame.contentWindow);
      cmd.lireDans(frame.contentWindow);
      /* Les DEUX : focus() sur l'element donne le focus au cadre, focus()
         sur sa fenetre le donne a son document. Sans le premier, les touches
         restaient au menu et le jeu ne voyait rien passer (banc, verdict 7). */
      frame.focus();
      frame.contentWindow.focus();
      /* Le pointeur n'a rien a faire sur une borne, et les jeux ne le savent
         pas : ils sont aussi joues a la souris ailleurs. On le masque donc
         ICI, dans le document du jeu — meme origine, donc c'est permis — au
         lieu de demander aux deux jeux de porter une regle de borne. */
      const style = frame.contentDocument.createElement('style');
      style.id = 'borne-sans-pointeur';
      style.textContent = '*, *::before, *::after { cursor: none !important; }';
      frame.contentDocument.head.appendChild(style);
    } catch { /* jeu deja retire */ }
    cmd.vider();
  });
  document.body.appendChild(frame);
  menu.classList.add('parti');
  jeuEnCours = { def: t.def, frame };
  cmd.vider();
}

function revenirAuMenu() {
  if (!jeuEnCours) return;
  const { frame } = jeuEnCours;
  jeuEnCours = null;
  try { cmd.oublierFenetre(frame.contentWindow); } catch { /* deja parti */ }
  cmd.lireDans(window);
  /* Retirer l'iframe detruit le document du jeu : boucle d'images arretee,
     contexte audio ferme, memoire rendue. C'est tout l'interet de l'iframe
     sur une navigation. */
  frame.remove();
  menu.classList.remove('parti');
  jauge.classList.remove('on');
  barre.style.width = '0';
  cmd.vider();
  window.focus();
}

/* --- La boucle ----------------------------------------------------------- */

function boucle() {
  cmd.tour();

  if (!jeuEnCours) {
    const cap = cmd.cap();
    if (cap.x) designer(choix + cap.x);
    if (cmd.front('valider')) lancer(tuiles[choix]);
  } else {
    const part = cmd.comboRetour();
    jauge.classList.toggle('on', part > 0);
    barre.style.width = `${Math.round(part * 100)}%`;
    if (part >= 1) revenirAuMenu();
    else if (INACTIF_MS && performance.now() - cmd.activite > INACTIF_MS) revenirAuMenu();
  }

  requestAnimationFrame(boucle);
}
requestAnimationFrame(boucle);

/* Accroches pour le banc (borne/banc.mjs) : l'etat qu'on veut verifier sans
   avoir a deviner le DOM. */
window.__borne = {
  get jeu() { return jeuEnCours?.def.id || null; },
  get choix() { return tuiles[choix]?.def.id || null; },
  get retour() { return cmd.comboRetour(); },
  get iframes() { return document.querySelectorAll('iframe').length; },
  get presents() { return tuiles.filter((t) => t.present).map((t) => t.def.id); },
  COMBO_MS,
  revenirAuMenu,
};
