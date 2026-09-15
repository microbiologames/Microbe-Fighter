import { Input } from './engine/Input.js';
import { loadCharacter } from './engine/SpriteLoader.js';
import { Fighter } from './engine/Fighter.js';
import { loadStage, drawStage, updateStage } from './engine/Stage.js';
import { drawHUD } from './engine/HUD.js';
import { updateHitEffects, drawHitEffects, clearHitEffects, getScreenShakeOffset } from './engine/Effects.js';
import { playSfx } from './engine/Audio.js';
import { playMusic, stopMusic } from './engine/Music.js';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, ROUND_TIME_SECONDS, ARENA_LEFT, ARENA_RIGHT, MAX_HEALTH,
  ROUNDS_TO_WIN, ROUND_RESULT_DISPLAY_MS,
} from './engine/Config.js';

const JINGLE_STARTUP = 'assets/audio/sfx/jingle/jingle-1.wav';
const JINGLE_FIGHT_START = 'assets/audio/sfx/jingle/jingle-2.wav';
const JINGLE_FIGHT_END = 'assets/audio/sfx/jingle/jingle-3.wav';

// Un décor différent est tiré au sort à chaque combat. Ajoute simplement le
// nom du fichier (sans .json) ici pour qu'un nouveau décor entre dans la
// rotation dès que son manifeste existe dans js/data/stages/.
const STAGE_FILES = [
  'paillasse', 'boite-de-petri', 'hotte', 'salle-de-culture',
  'congelateur', 'autoclave', 'microscope', 'intestin',
];

// Les trois longues pistes (title-screen, ambient-theme, combat-low-hp) ne sont
// pas versionnées : 27 Mo chacune en WAV. Le motif Strudel qui les produit est à
// côté, dans assets/audio/music/*.js. Music.js est silencieux tant que le
// fichier est absent, donc le jeu tourne sans elles — dépose les .wav (ou des
// .ogg, en ajustant l'extension ici) pour les réactiver.
const TITLE_MUSIC = 'assets/audio/music/title-screen.wav';
const AMBIENT_MUSIC = 'assets/audio/music/ambient-theme.wav';
const COMBAT_LOW_HP_MUSIC = 'assets/audio/music/combat-low-hp.wav';
const VICTORY_MUSIC = 'assets/audio/music/victory.wav';
const LOW_HP_THRESHOLD = MAX_HEALTH * 0.5;

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const overlayTitle = document.getElementById('overlay-title');
const overlaySelect = document.getElementById('overlay-select');
const overlayStageSelect = document.getElementById('overlay-stage-select');
const overlayResult = document.getElementById('overlay-result');
const overlayPause = document.getElementById('overlay-pause');
const resultText = document.getElementById('result-text');
const resultHint = document.getElementById('result-hint');
const stageSelectPreview = document.getElementById('stage-select-preview');
const stageSelectName = document.getElementById('stage-select-name');
const titleRoster = document.getElementById('title-roster');

const selectDom = {
  1: {
    root: document.getElementById('select-p1'),
    portrait: document.getElementById('select-p1-portrait'),
    name: document.getElementById('select-p1-name'),
  },
  2: {
    root: document.getElementById('select-p2'),
    portrait: document.getElementById('select-p2-portrait'),
    name: document.getElementById('select-p2-name'),
  },
};

const input = new Input();

const GAME_STATE = {
  LOADING: 'loading', ERROR: 'error', TITLE: 'title', SELECT: 'select', STAGE_SELECT: 'stage_select',
  FIGHT: 'fight', PAUSED: 'paused', ROUND_RESULT: 'round_result', RESULT: 'result',
};
let gameState = GAME_STATE.LOADING;
let stateBeforePause = null;
let loadError = null;

let roster, stages, stage;
let fighter1, fighter2, timeLeft;
let roundWins = { 1: 0, 2: 0 };
let roundResultTimer = 0;
const selection = {
  1: { index: 0, ready: false },
  2: { index: 1, ready: false },
};
const stageSelection = { index: 0 };

// Tant qu'un portrait ou qu'un fond de décor n'a pas été généré, on remplit son
// cadre avec la couleur du personnage / la palette du décor au lieu de laisser
// une image cassée à l'écran (même logique que les placeholders du canvas).
function applyPreview(imgEl, src, fallbackBackground) {
  const frame = imgEl.parentElement;
  if (src) {
    imgEl.hidden = false;
    imgEl.src = src;
    if (frame) frame.style.background = '';
  } else {
    imgEl.hidden = true;
    imgEl.removeAttribute('src');
    if (frame) frame.style.background = fallbackBackground;
  }
}

function stagePreviewBackground(stageData) {
  const p = stageData?.palette;
  if (!p) return '#444';
  return `linear-gradient(to bottom, ${p.far} 0%, ${p.mid} 60%, ${p.floor} 100%)`;
}

function pickRandomStage() {
  stage = stages[Math.floor(Math.random() * stages.length)];
}

function renderTitleRoster() {
  titleRoster.innerHTML = '';
  for (const char of roster) {
    const item = document.createElement('div');
    item.className = 'title-roster-item';
    const img = document.createElement('img');
    img.alt = char.displayName;
    item.appendChild(img);
    applyPreview(img, char.portrait?.src, char.color);
    titleRoster.appendChild(item);
  }
}

async function boot() {
  try {
    const [[gramChar, petriChar, staphyChar, coliChar, ...loadedStages]] = await Promise.all([
      Promise.all([
        loadCharacter('js/data/characters/gram.json'),
        loadCharacter('js/data/characters/petri.json'),
        loadCharacter('js/data/characters/staphy.json'),
        loadCharacter('js/data/characters/coli.json'),
        ...STAGE_FILES.map((f) => loadStage(`js/data/stages/${f}.json`)),
      ]),
      document.fonts.load('16px "Press Start 2P"'),
    ]);
    roster = [gramChar, petriChar, staphyChar, coliChar];
    stages = loadedStages;
    pickRandomStage();
    renderTitleRoster();
    gameState = GAME_STATE.TITLE;
    playSfx(JINGLE_STARTUP);
    playMusic(TITLE_MUSIC, { volume: 0.5 });
  } catch (err) {
    console.error(err);
    loadError = err.message;
    gameState = GAME_STATE.ERROR;
  }
}

function enterSelect() {
  selection[1].ready = false;
  selection[2].ready = false;
  roundWins = { 1: 0, 2: 0 };
  gameState = GAME_STATE.SELECT;
  overlayTitle.classList.add('hidden');
  overlayResult.classList.add('hidden');
  overlayStageSelect.classList.add('hidden');
  overlaySelect.classList.remove('hidden');
  renderSelectUI();
  playMusic(TITLE_MUSIC, { volume: 0.5 });
}

function renderSelectUI() {
  for (const p of [1, 2]) {
    const sel = selection[p];
    const char = roster[sel.index];
    const dom = selectDom[p];
    applyPreview(dom.portrait, char.portrait?.src, char.color);
    dom.name.textContent = char.displayName;
    dom.root.classList.toggle('ready', sel.ready);
  }
}

function updateSelect() {
  for (const p of [1, 2]) {
    const sel = selection[p];
    if (sel.ready) {
      if (input.justPressed(p, 'kick')) sel.ready = false;
      continue;
    }
    if (input.justPressed(p, 'left')) sel.index = (sel.index - 1 + roster.length) % roster.length;
    if (input.justPressed(p, 'right')) sel.index = (sel.index + 1) % roster.length;
    if (input.justPressed(p, 'punch') || input.justPressed(p, 'start')) sel.ready = true;
  }
  renderSelectUI();

  if (selection[1].ready && selection[2].ready) {
    enterStageSelect();
  }
}

function enterStageSelect() {
  stageSelection.index = Math.max(0, stages.indexOf(stage));
  gameState = GAME_STATE.STAGE_SELECT;
  overlaySelect.classList.add('hidden');
  overlayStageSelect.classList.remove('hidden');
  renderStageSelectUI();
}

function renderStageSelectUI() {
  const chosen = stages[stageSelection.index];
  applyPreview(stageSelectPreview, chosen.background?.src, stagePreviewBackground(chosen));
  stageSelectName.textContent = chosen.name || '—';
}

function updateStageSelect() {
  if (input.justPressed(1, 'left') || input.justPressed(2, 'left')) {
    stageSelection.index = (stageSelection.index - 1 + stages.length) % stages.length;
  }
  if (input.justPressed(1, 'right') || input.justPressed(2, 'right')) {
    stageSelection.index = (stageSelection.index + 1) % stages.length;
  }
  renderStageSelectUI();

  const confirmed = ['punch', 'start'].some((a) => input.justPressed(1, a) || input.justPressed(2, a));
  if (confirmed) {
    startFight(roster[selection[1].index], roster[selection[2].index], stages[stageSelection.index]);
  }
}

function startFight(char1, char2, chosenStage) {
  fighter1 = new Fighter(char1, 1, (ARENA_LEFT + CANVAS_WIDTH / 2) / 2 - 20, 1);
  fighter2 = new Fighter(char2, 2, (ARENA_RIGHT + CANVAS_WIDTH / 2) / 2 + 20, -1);
  timeLeft = ROUND_TIME_SECONDS;
  gameState = GAME_STATE.FIGHT;
  stage = chosenStage;
  overlayStageSelect.classList.add('hidden');
  overlayResult.classList.add('hidden');
  clearHitEffects();
  playSfx(JINGLE_FIGHT_START);
  playMusic(AMBIENT_MUSIC, { volume: 0.5 });
}

function endRound(winner) {
  if (winner) {
    roundWins[winner.playerIndex]++;
    playSfx(winner.character.sfx.victory);
    winner.playVictory();
  }

  const matchWinner = roundWins[1] >= ROUNDS_TO_WIN ? fighter1 : roundWins[2] >= ROUNDS_TO_WIN ? fighter2 : null;
  const score = `${roundWins[1]} - ${roundWins[2]}`;

  overlayResult.classList.remove('hidden');

  if (matchWinner) {
    resultText.textContent = `${matchWinner.character.displayName.toUpperCase()} GAGNE LE MATCH ! (${score})`;
    resultHint.textContent = 'Appuyez sur ENTRÉE pour rejouer';
    gameState = GAME_STATE.RESULT;
    playSfx(JINGLE_FIGHT_END);
    playMusic(VICTORY_MUSIC, { volume: 0.6, fadeMs: 200 });
  } else {
    resultText.textContent = winner
      ? `${winner.character.displayName.toUpperCase()} REMPORTE LA MANCHE (${score})`
      : 'MANCHE NULLE !';
    resultHint.textContent = 'Manche suivante...';
    gameState = GAME_STATE.ROUND_RESULT;
    roundResultTimer = ROUND_RESULT_DISPLAY_MS;
    stopMusic({ fadeMs: 400 });
  }
}

function startNextRound() {
  startFight(fighter1.character, fighter2.character, stage);
}

function pauseFight() {
  stateBeforePause = gameState;
  gameState = GAME_STATE.PAUSED;
  overlayPause.classList.remove('hidden');
}

function resumeFight() {
  gameState = stateBeforePause ?? GAME_STATE.FIGHT;
  stateBeforePause = null;
  overlayPause.classList.add('hidden');
}

function quitFromPause() {
  overlayPause.classList.add('hidden');
  enterSelect();
  // Contrairement à un retour normal au menu (musique de titre), en sortant
  // du combat via la pause on garde l'ambiance du combat sur l'écran de choix.
  playMusic(AMBIENT_MUSIC, { volume: 0.5, fadeMs: 300 });
}

function update(dt) {
  if (stage) updateStage(stage, dt);

  if ((gameState === GAME_STATE.FIGHT || gameState === GAME_STATE.ROUND_RESULT) && input.justPressedRaw('Escape')) {
    pauseFight();
    return;
  }

  if (gameState === GAME_STATE.PAUSED) {
    if (input.justPressedRaw('Escape')) resumeFight();
    else if (input.justPressed(1, 'start') || input.justPressed(2, 'start')) quitFromPause();
    return;
  }

  if (gameState === GAME_STATE.TITLE) {
    if (input.justPressed(1, 'start') || input.justPressed(2, 'start')) enterSelect();
    return;
  }

  if (gameState === GAME_STATE.SELECT) {
    updateSelect();
    return;
  }

  if (gameState === GAME_STATE.STAGE_SELECT) {
    updateStageSelect();
    return;
  }

  if (gameState === GAME_STATE.ROUND_RESULT) {
    fighter1.tickAnimationOnly(dt);
    fighter2.tickAnimationOnly(dt);
    roundResultTimer -= dt;
    if (roundResultTimer <= 0) startNextRound();
    return;
  }

  if (gameState === GAME_STATE.RESULT) {
    fighter1.tickAnimationOnly(dt);
    fighter2.tickAnimationOnly(dt);
    if (input.justPressed(1, 'start') || input.justPressed(2, 'start')) enterSelect();
    return;
  }

  if (gameState === GAME_STATE.FIGHT) {
    fighter1.update(dt, input, fighter2);
    fighter2.update(dt, input, fighter1);
    updateHitEffects(dt);

    if (!fighter1.ko && !fighter2.ko &&
        (fighter1.health <= LOW_HP_THRESHOLD || fighter2.health <= LOW_HP_THRESHOLD)) {
      playMusic(COMBAT_LOW_HP_MUSIC, { volume: 0.55 });
    }

    timeLeft -= dt / 1000;

    if (fighter1.ko && !fighter2.ko) {
      endRound(fighter2);
    } else if (fighter2.ko && !fighter1.ko) {
      endRound(fighter1);
    } else if (fighter1.ko && fighter2.ko) {
      endRound(null);
    } else if (timeLeft <= 0) {
      if (fighter1.health === fighter2.health) endRound(null);
      else endRound(fighter1.health > fighter2.health ? fighter1 : fighter2);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (gameState === GAME_STATE.LOADING || gameState === GAME_STATE.ERROR) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = gameState === GAME_STATE.ERROR ? '#e63946' : '#fff';
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    const msg = gameState === GAME_STATE.ERROR ? `Erreur de chargement : ${loadError}` : 'Chargement...';
    ctx.fillText(msg, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    return;
  }

  // Le tremblement d'écran s'applique au décor/combattants, pas au HUD
  // (sinon les barres de vie tremblent aussi, ce qui perturbe la lecture).
  const shake = getScreenShakeOffset();
  ctx.save();
  ctx.translate(shake.x, shake.y);
  drawStage(ctx, stage);

  if (fighter1 && fighter2) {
    // ordre de dessin simple : le perso le plus en arrière (y le plus petit à l'écran) d'abord
    const order = fighter1.x <= fighter2.x ? [fighter1, fighter2] : [fighter2, fighter1];
    for (const f of order) f.draw(ctx);
    drawHitEffects(ctx);
  }
  ctx.restore();

  if (fighter1 && fighter2) {
    drawHUD(ctx, fighter1, fighter2, timeLeft ?? 0, roundWins);
  }
}

let lastTime = performance.now();
function loop(now) {
  const dt = Math.min(50, now - lastTime); // cap pour éviter les gros sauts (ex: tab en arrière-plan)
  lastTime = now;

  update(dt);
  draw();
  input.endFrame();

  requestAnimationFrame(loop);
}

boot().then(() => requestAnimationFrame(loop));
