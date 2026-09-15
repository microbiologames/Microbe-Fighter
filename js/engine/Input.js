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

// Boutons standard du Gamepad API (mapping "standard")
const GAMEPAD_BUTTONS = { punch: 0, kick: 2, dodge: 1, taunt: 3, start: 9 };
const GAMEPAD_AXIS_THRESHOLD = 0.4;

export class Input {
  constructor() {
    this.keysDown = new Set();
    this.pressedThisFrame = new Set();
    this._prevGamepadButtons = { 1: {}, 2: {} };

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
  }

  _gamepadFor(playerIndex) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    return pads[playerIndex - 1] || null;
  }

  /** État courant (maintenu) d'une action pour un joueur donné */
  isDown(playerIndex, action) {
    const map = KEY_MAPS[playerIndex];
    if (map && this.keysDown.has(map[action])) return true;

    const pad = this._gamepadFor(playerIndex);
    if (!pad) return false;

    if (action === 'left') return pad.axes[0] < -GAMEPAD_AXIS_THRESHOLD || pad.buttons[14]?.pressed;
    if (action === 'right') return pad.axes[0] > GAMEPAD_AXIS_THRESHOLD || pad.buttons[15]?.pressed;
    if (action === 'up') return pad.axes[1] < -GAMEPAD_AXIS_THRESHOLD || pad.buttons[12]?.pressed;
    if (action === 'down') return pad.axes[1] > GAMEPAD_AXIS_THRESHOLD || pad.buttons[13]?.pressed;
    if (GAMEPAD_BUTTONS[action] !== undefined) return !!pad.buttons[GAMEPAD_BUTTONS[action]]?.pressed;
    return false;
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
    const btnIndex = GAMEPAD_BUTTONS[action];
    if (btnIndex === undefined) return false;
    const now = !!pad.buttons[btnIndex]?.pressed;
    const prev = !!this._prevGamepadButtons[playerIndex][action];
    this._prevGamepadButtons[playerIndex][action] = now;
    return now && !prev;
  }
}
