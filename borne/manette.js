/* ---------------------------------------------------------------------------
   Lecture des commandes de la borne, pour le menu comme pour la page de
   releve. Un seul endroit sait quel bouton fait quoi : c'est celui qu'on
   corrige quand le releve de l'encodeur ne tombe pas sur ces index.

   L'encodeur USB de la borne est vu par le navigateur comme UNE OU DEUX
   manettes. Les index ci-dessous sont ceux du mappage « standard » du
   Gamepad API, et ce sont ceux que Microbe Fighter utilise deja
   (js/engine/Input.js) : les deux jeux de la borne se jouent donc avec les
   memes boutons, ce qui est la demande. A verifier avec touches.html, un
   encodeur pouvant tres bien numeroter autrement.
--------------------------------------------------------------------------- */

export const BOUTONS = {
  valider: [0, 2, 9],   // poing, pied, START
  retour: [1, 3],       // esquive, narguer
  start: [9],
  select: [8],
};
export const DPAD = { haut: 12, bas: 13, gauche: 14, droite: 15 };

/* Seuil d'axe repris de Microbe Fighter, qui tourne sur cette borne depuis
   le debut : meme materiel, meme seuil. Un encodeur est tout-ou-rien, la
   valeur ne compte que pour une vraie manette analogique. */
export const SEUIL = 0.4;

/* Maintien pour revenir au menu. 1,5 s est un CHOIX, pas une mesure : assez
   long pour qu'aucun appui de jeu ne le declenche par accident, assez court
   pour qu'on ne croie pas la borne bloquee. La jauge a l'ecran dit ce qui
   reste a tenir, sinon l'attente passe pour une panne. A confronter au geste
   deja en place sur la borne quand on l'aura sous les yeux. */
export const COMBO_MS = 1500;

const TOUCHES = {
  valider: ['Enter', 'NumpadEnter', 'Space', 'KeyF', 'KeyK'],
  gauche: ['ArrowLeft', 'KeyA', 'KeyQ'],
  droite: ['ArrowRight', 'KeyD'],
  haut: ['ArrowUp', 'KeyW', 'KeyZ'],
  bas: ['ArrowDown', 'KeyS'],
  start1: ['Enter'],
  start2: ['NumpadEnter'],
};

export class Commandes {
  constructor() {
    /* La fenetre dont on interroge les manettes. Chromium ne livre l'etat
       des manettes qu'au document qui a le focus : quand un jeu tourne dans
       l'iframe, c'est LUI qui l'a, donc c'est son navigator qu'il faut
       interroger. Meme origine, donc c'est permis. A CONFIRMER sur la borne
       (relever que la jauge de retour se remplit pendant une partie). */
    this.fenetre = window;
    this.touches = new Set();
    this._fenetres = new Map();
    this._prev = new Map();
    this._fronts = new Set();
    this._frontsTouches = new Set();
    this._frontsImage = new Set();
    this._capLatch = { x: 0, y: 0 };
    this._cap = { x: 0, y: 0 };
    this._comboDepuis = 0;
    this.activite = performance.now();
    this.ecouterFenetre(window);
  }

  /** Le clavier d'une fenetre (celle du menu, puis celle du jeu lance). */
  ecouterFenetre(w) {
    if (!w || this._fenetres.has(w)) return;
    const bas = (e) => {
      if (!e.repeat) this._frontsTouches.add(e.code);
      this.touches.add(e.code);
      this.activite = performance.now();
    };
    const haut = (e) => this.touches.delete(e.code);
    const paumes = () => this.touches.clear();
    try {
      w.addEventListener('keydown', bas);
      w.addEventListener('keyup', haut);
      w.addEventListener('blur', paumes);
      this._fenetres.set(w, { bas, haut, paumes });
    } catch { /* fenetre deja partie */ }
  }

  oublierFenetre(w) {
    const h = this._fenetres.get(w);
    if (!h) return;
    try {
      w.removeEventListener('keydown', h.bas);
      w.removeEventListener('keyup', h.haut);
      w.removeEventListener('blur', h.paumes);
    } catch { /* document detruit : les ecouteurs sont partis avec lui */ }
    this._fenetres.delete(w);
    /* Une touche tenue au moment ou l'iframe disparait ne sera jamais
       relachee : sans ce vidage elle restait pressee pour toujours. */
    this.touches.clear();
  }

  lireDans(w) { this.fenetre = w || window; }

  _pads() {
    try {
      const nav = this.fenetre?.navigator;
      return Array.from(nav?.getGamepads?.() || []);
    } catch {
      /* L'iframe peut avoir ete detruite entre deux images. */
      return Array.from(window.navigator.getGamepads?.() || []);
    }
  }

  /** Une image : fronts de boutons, cap des joysticks, maintien du combo. */
  tour() {
    const pads = this._pads();
    this._fronts.clear();
    /* Un front de clavier ne vit qu'UNE image, comme un front de bouton :
       garde en reserve, il se vidait au mauvais moment. C'est le defaut
       mesure dans Cell Dungeon (banc manette, verdict 18), ou une touche
       pressee en jeu validait l'ecran suivant a son ouverture. */
    this._frontsImage = this._frontsTouches;
    this._frontsTouches = new Set();
    let x = 0, y = 0;
    let bouge = false;

    for (const [i, pad] of pads.entries()) {
      if (!pad) { this._prev.delete(i); continue; }
      const prev = this._prev.get(i) || [];
      const now = pad.buttons.map((b) => !!b.pressed);
      for (const [b, on] of now.entries()) {
        if (on && !prev[b]) { this._fronts.add(`${i}:${b}`); bouge = true; }
      }
      this._prev.set(i, now);

      const ax = (Math.abs(pad.axes[0] || 0) > SEUIL ? Math.sign(pad.axes[0]) : 0)
        + (pad.buttons[DPAD.droite]?.pressed ? 1 : 0) - (pad.buttons[DPAD.gauche]?.pressed ? 1 : 0);
      const ay = (Math.abs(pad.axes[1] || 0) > SEUIL ? Math.sign(pad.axes[1]) : 0)
        + (pad.buttons[DPAD.bas]?.pressed ? 1 : 0) - (pad.buttons[DPAD.haut]?.pressed ? 1 : 0);
      if (ax && !x) x = Math.sign(ax);
      if (ay && !y) y = Math.sign(ay);
      if (ax || ay) bouge = true;
    }

    /* Clavier : meme cap, pour le poste de developpement et pour le banc.
       Touche TENUE ou simplement enfoncee pendant l'image : une tape plus
       courte qu'une image ne bougeait pas le menu, et au clavier une tape
       dure 10 ms la ou un joystick de borne reste pousse un dixieme de
       seconde. Mesure au banc : un appui simule ne deplacait la designation
       qu'une fois sur deux. */
    if (!x) x = (this._capTouche('droite') ? 1 : 0) - (this._capTouche('gauche') ? 1 : 0);
    if (!y) y = (this._capTouche('bas') ? 1 : 0) - (this._capTouche('haut') ? 1 : 0);

    /* Cap par FRONT : un joystick tenu ne doit pas defiler le menu. */
    this._cap.x = x && !this._capLatch.x ? x : 0;
    this._cap.y = y && !this._capLatch.y ? y : 0;
    this._capLatch.x = x;
    this._capLatch.y = y;

    if (bouge) this.activite = performance.now();
    this._majCombo(pads);
  }

  _touche(action) {
    return TOUCHES[action].some((c) => this.touches.has(c));
  }

  /** Tenue, ou enfoncee pendant cette image. Sans consommer le front. */
  _capTouche(action) {
    return TOUCHES[action].some((c) => this.touches.has(c) || this._frontsImage.has(c));
  }

  _tenuPad(pads, i, boutons) {
    const pad = pads[i];
    return !!pad && boutons.some((b) => pad.buttons[b]?.pressed);
  }

  /**
   * Le geste de retour au menu. Trois formes, parce qu'on ne sait pas encore
   * combien de peripheriques l'encodeur presente :
   *   - les DEUX START, un par manette : le geste a deux mains de la borne ;
   *   - START + SELECT sur la meme manette : le repli si l'encodeur n'expose
   *     qu'un seul peripherique (et le geste classique des bornes MAME) ;
   *   - les deux touches START au clavier, pour le poste de developpement.
   * Aucune n'est atteignable par accident en jouant : toutes demandent deux
   * boutons tenus ensemble, et aucun des deux ne sert en combat.
   */
  _majCombo(pads) {
    const deuxStarts = this._tenuPad(pads, 0, BOUTONS.start) && this._tenuPad(pads, 1, BOUTONS.start);
    const startSelect = pads.some((p, i) => p
      && this._tenuPad(pads, i, BOUTONS.start) && this._tenuPad(pads, i, BOUTONS.select));
    const clavier = this._touche('start1') && this._touche('start2');
    const tenu = deuxStarts || startSelect || clavier;
    if (!tenu) { this._comboDepuis = 0; return; }
    if (!this._comboDepuis) this._comboDepuis = performance.now();
    this.activite = performance.now();
  }

  /** Fraction du maintien de retour deja tenue, 0 a 1. */
  comboRetour() {
    if (!this._comboDepuis) return 0;
    return Math.min(1, (performance.now() - this._comboDepuis) / COMBO_MS);
  }

  /** Cap horizontal / vertical de l'image, -1, 0 ou 1. */
  cap() { return { x: this._cap.x, y: this._cap.y }; }

  /** Front d'une action, boutons et clavier confondus. Consomme. */
  front(action) {
    const boutons = BOUTONS[action] || [];
    for (const cle of this._fronts) {
      if (boutons.includes(Number(cle.split(':')[1]))) { this._fronts.delete(cle); return true; }
    }
    const codes = TOUCHES[action] || [];
    for (const code of codes) {
      if (this._frontsImage?.has(code)) { this._frontsImage.delete(code); return true; }
    }
    return false;
  }

  /** Oublie tout ce qui est en attente : a l'entree et a la sortie d'un jeu. */
  vider() {
    this._fronts.clear();
    this._frontsTouches.clear();
    this._frontsImage?.clear();
    this._comboDepuis = 0;
    this._capLatch = { x: 0, y: 0 };
    this.activite = performance.now();
  }
}
