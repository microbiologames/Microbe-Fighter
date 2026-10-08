// Abstraction clavier + manette (utile pour les encodeurs USB de borne d'arcade,
// qui sont vus par le navigateur comme un Gamepad ou comme un clavier selon le mode).

const KEY_MAPS = {
  1: {
    left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS',
    punch: 'KeyF', kick: 'KeyG', dodge: 'KeyH', taunt: 'KeyT', start: 'Enter',
  },
  2: {
    left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown',
    punch: 'KeyK', kick: 'KeyL', dodge: 'Semicolon', taunt: 'KeyO', start: 'NumpadEnter',
  },
};

/* Mappage de la borne, reporte depuis le js/engine/Input.js de Family Fight,
   le jeu qui tourne sur ce meuble : releve en direct (CDP) sur ses deux
   cartes DragonRise le 18/08/2026. 0 = A vert, 1 = B rouge, 2 = Y jaune,
   3 = X bleu. Deux ecarts avec la version precedente, tous deux mesures :
   - taunt et dodge etaient inverses (1 et 3) par rapport a la borne ;
   - il n'y a NI START NI SELECT sur ce meuble, les index 8 et 9 n'existent
     pas. 'start' quitte donc le mappage manette et ne reste que sur le
     clavier (KEY_MAPS) ; les ecrans qui n'attendaient que lui acceptent
     maintenant le poing, comme tous les menus de cette borne (voir main.js).
   Le bouton 4 (Z blanc) n'est volontairement pas mappe ici : il porte le
   geste de retour au menu, que le lanceur lit par-dessus le jeu. */
const GAMEPAD_BUTTONS = { punch: 0, kick: 2, taunt: 1, dodge: 3 };
const GAMEPAD_AXIS_THRESHOLD = 0.4;

/* Les deux joysticks de la borne sont montes EN MIROIR : sur la carte
   d'index 0 (joueur 1), pousser a gauche donne axes[0] = +1 et vers le haut
   axes[1] = +1, l'inverse de la convention. Mesure du 18/08/2026, reprise de
   Family Fight. CHOIX d'implementation, et c'en est un : Family Fight corrige
   toute manette d'index 0, ce qu'il peut faire puisqu'il ne tourne que sur ce
   meuble ; Microbe Fighter se joue aussi en ligne a la manette de salon, donc
   on ne corrige que les cartes DragonRise de la borne. */
const BORNE_DRAGONRISE = /dragonrise|0079/i;
const miroirAxes = (pad) => (pad.index === 0 && BORNE_DRAGONRISE.test(pad.id || '') ? -1 : 1);

/* Les actions dont endFrame() avance l'instantane manette. 'start' n'y est
   pas : il n'existe pas sur l'encodeur de cette borne et ne vit plus que sur
   le clavier, dont les fronts passent par pressedThisFrame. */
const TRACKED_ACTIONS = ['left', 'right', 'up', 'down', 'punch', 'kick', 'dodge', 'taunt'];

export class Input {
  constructor() {
    this.keysDown = new Set();
    this.pressedThisFrame = new Set();
    // cle "joueur:action" -> l'action etait-elle active a l'image precedente
    this._prevGamepadAction = {};

    window.addEventListener('keydown', (e) => {
      if (!this.keysDown.has(e.code)) this.pressedThisFrame.add(e.code);
      this.keysDown.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
    });
  }

  // à appeler une fois par frame, après avoir lu les actions "justPressed"
  endFrame() {
    this.pressedThisFrame.clear();

    /* Avance l'instantane manette d'UNE image, ici et une seule fois -- pas
       dans justPressed(). Une meme action est souvent lue plusieurs fois dans
       la meme image : si chaque lecture avancait son propre instantane, la
       deuxieme verrait "deja vu" et ne se declencherait jamais, meme sur un
       appui neuf.
       Defaut RELEVE SUR LA BORNE le 8/10/2026 : jauge de retour tenue, le
       poing et le pied ne repondaient plus, et il fallait passer par
       l'attaque speciale -- lue une seule fois -- pour les retrouver.
       Correction reprise de Family Fight, qui portait deja le moteur
       corrige ; Microbe Fighter en gardait une version anterieure. */
    for (let p = 1; p <= 2; p++) {
      const pad = this._gamepadFor(p);
      if (!pad) continue;
      for (const action of TRACKED_ACTIONS) {
        this._prevGamepadAction[p + ':' + action] = !!this._gamepadActionDown(pad, action);
      }
    }
  }

  _gamepadFor(playerIndex) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    return pads[playerIndex - 1] || null;
  }

  /** Une action sur UNE manette : bouton, ou direction par axe ou par hat. */
  _gamepadActionDown(pad, action) {
    const sign = miroirAxes(pad);
    if (action === 'left') return pad.axes[0] * sign < -GAMEPAD_AXIS_THRESHOLD || pad.buttons[14]?.pressed;
    if (action === 'right') return pad.axes[0] * sign > GAMEPAD_AXIS_THRESHOLD || pad.buttons[15]?.pressed;
    if (action === 'up') return pad.axes[1] * sign < -GAMEPAD_AXIS_THRESHOLD || pad.buttons[12]?.pressed;
    if (action === 'down') return pad.axes[1] * sign > GAMEPAD_AXIS_THRESHOLD || pad.buttons[13]?.pressed;
    if (GAMEPAD_BUTTONS[action] !== undefined) return !!pad.buttons[GAMEPAD_BUTTONS[action]]?.pressed;
    return false;
  }

  /** État courant (maintenu) d'une action pour un joueur donné */
  isDown(playerIndex, action) {
    const map = KEY_MAPS[playerIndex];
    if (map && this.keysDown.has(map[action])) return true;

    const pad = this._gamepadFor(playerIndex);
    if (!pad) return false;
    return !!this._gamepadActionDown(pad, action);
  }

  /** Touche brute non liée à un joueur (ex: Échap pour la pause) */
  justPressedRaw(code) {
    return this.pressedThisFrame.has(code);
  }

  /** Vrai uniquement sur la frame où l'action vient d'être déclenchée */
  justPressed(playerIndex, action) {
    const map = KEY_MAPS[playerIndex];
    if (map && this.pressedThisFrame.has(map[action])) return true;

    const pad = this._gamepadFor(playerIndex);
    if (!pad) return false;
    /* Front sur N'IMPORTE QUELLE action manette, direction comprise. La
       version precedente sortait d'emblee des que l'action n'etait pas un
       bouton : 'left', 'right', 'up' et 'down' rendaient donc TOUJOURS faux a
       la manette. Releve SUR LA BORNE le 8/10/2026 : les joysticks etaient
       morts a l'ecran de choix des personnages, et le saut ne partait pas,
       alors que le deplacement -- lu en maintien par isDown -- marchait.
       Lecture PURE : c'est endFrame() qui avance l'instantane, une fois par
       image. */
    const now = !!this._gamepadActionDown(pad, action);
    const prev = !!this._prevGamepadAction[playerIndex + ':' + action];
    return now && !prev;
  }
}
