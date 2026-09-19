import { Input } from './engine/Input.js';
import { loadCharacter } from './engine/SpriteLoader.js';
import { Fighter } from './engine/Fighter.js';
import { loadStage, drawStage, updateStage } from './engine/Stage.js';
import { Camera } from './engine/Camera.js';
import { drawHUD, drawArenaHUD, drawArenaEnemyBars, sansAccents } from './engine/HUD.js';
import { updateHitEffects, drawHitEffects, clearHitEffects, getScreenShakeOffset } from './engine/Effects.js';
import { updateAllies, drawAllies, clearAllies } from './engine/Allies.js';
import { playSfx } from './engine/Audio.js';
import { startMusic } from './engine/Music.js';
import { Arena } from './engine/Arena.js';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, ROUND_TIME_SECONDS,
  ROUNDS_TO_WIN, ROUND_RESULT_DISPLAY_MS, versionne } from './engine/Config.js';

// Un décor différent est tiré au sort à chaque combat. Ajoute simplement le
// nom du fichier (sans .json) ici pour qu'un nouveau décor entre dans la
// rotation dès que son manifeste existe dans js/data/stages/.
const STAGE_FILES = [
  'labo', 'labo-nuit',
];

// Une seule musique, en boucle, du lancement du jeu jusqu'à la fin. Pour en
// changer : déposer le fichier dans assets/audio/music/ et ajuster cette ligne.
const MUSIC = 'assets/audio/music/Flamme_pure.mp3';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const overlayTitle = document.getElementById('overlay-title');
const overlayMode = document.getElementById('overlay-mode');
const overlaySelect = document.getElementById('overlay-select');
const overlayStageSelect = document.getElementById('overlay-stage-select');
const overlayResult = document.getElementById('overlay-result');
const overlayPause = document.getElementById('overlay-pause');
const resultText = document.getElementById('result-text');
const resultHint = document.getElementById('result-hint');
const stageSelectPreview = document.getElementById('stage-select-preview');
const stageSelectName = document.getElementById('stage-select-name');
const selectTitle = document.getElementById('select-title');
const modeCards = [...document.querySelectorAll('#mode-row .mode-card')];

const selectDom = {
  1: {
    root: document.getElementById('select-p1'),
    portrait: document.getElementById('select-p1-portrait'),
    name: document.getElementById('select-p1-name'),
    tagline: document.getElementById('select-p1-tagline'),
    moves: document.getElementById('select-p1-moves'),
  },
  2: {
    root: document.getElementById('select-p2'),
    portrait: document.getElementById('select-p2-portrait'),
    name: document.getElementById('select-p2-name'),
    tagline: document.getElementById('select-p2-tagline'),
    moves: document.getElementById('select-p2-moves'),
  },
};

const input = new Input();

const GAME_STATE = {
  LOADING: 'loading', ERROR: 'error', TITLE: 'title', MODE_SELECT: 'mode_select',
  SELECT: 'select', STAGE_SELECT: 'stage_select',
  FIGHT: 'fight', PAUSED: 'paused', ROUND_RESULT: 'round_result', RESULT: 'result',
  ARENA: 'arena', ARENA_RESULT: 'arena_result',
};
// Les deux modes de jeu. DUEL est le jeu d'origine ; ARENE oppose un seul
// microbiologiste à des vagues de micro-organismes pilotés par la machine.
const MODE = { DUEL: 'duel', ARENE: 'arene' };

let gameState = GAME_STATE.LOADING;
let stateBeforePause = null;
let loadError = null;
let mode = MODE.DUEL;
let modeIndex = 0;

let roster, microbes, microbiologistes, stages, stage;
const camera = new Camera();
let fighter1, fighter2, timeLeft;
let arena = null;
let roundWins = { 1: 0, 2: 0 };
let roundResultTimer = 0;

// Chaque côté du sélecteur est VERROUILLÉ sur un camp : microbiologistes à
// gauche, micro-organismes à droite. `liste` est donc renseignée au démarrage
// et l'index ne se promène que dans ce camp-là.
const selection = {
  1: { index: 0, ready: false, liste: [] },
  2: { index: 0, ready: false, liste: [] },
};
const stageSelection = { index: 0 };

// Tant qu'un portrait ou qu'un fond de décor n'a pas été généré, on remplit son
// cadre avec la couleur du personnage / la palette du décor au lieu de laisser
// une image cassée à l'écran (même logique que les placeholders du canvas).
function applyPreview(imgEl, src, fallbackBackground) {
  const frame = imgEl.parentElement;
  if (src) {
    imgEl.hidden = false;
    imgEl.src = versionne(src);
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

/** Décor suivant de la rotation. En arène le joueur ne choisit pas : le décor
 * change tout seul à chaque vague. */
function stageSuivant() {
  const i = stages.indexOf(stage);
  stage = stages[(i + 1) % stages.length];
  camera.setStage(stage);
}

function cacherTousLesMenus() {
  for (const el of [overlayTitle, overlayMode, overlaySelect, overlayStageSelect, overlayResult, overlayPause]) {
    el.classList.add('hidden');
  }
}

async function boot() {
  try {
    // L'ordre de cette liste est celui du sélecteur :
    // les micro-organismes, puis les microbiologistes.
    const ROSTER_IDS = [
      'cereus', 'listeria', 'staph', 'salmonella', 'botulinum',
      'pseudomonas', 'shewanella', 'aspergillus',
      'mullis', 'franklin', 'baranyi', 'charpentier', 'fraser',
      'evans', 'appert', 'pasteur', 'metchnikoff',
    ];

    const [loadedCharacters, loadedStages] = await Promise.all([
      Promise.all(ROSTER_IDS.map((id) => loadCharacter(`js/data/characters/${id}.json`))),
      Promise.all(STAGE_FILES.map((f) => loadStage(`js/data/stages/${f}.json`))),
      document.fonts.load('16px "Press Start 2P"'),
    ]);
    roster = loadedCharacters;
    microbes = roster.filter((c) => c.faction === 'microbe');
    microbiologistes = roster.filter((c) => c.faction === 'microbiologiste');
    selection[1].liste = microbiologistes;
    selection[2].liste = microbes;
    stages = loadedStages;
    pickRandomStage();
    gameState = GAME_STATE.TITLE;
    startMusic(MUSIC, { volume: 0.45 });
  } catch (err) {
    console.error(err);
    loadError = err.message;
    gameState = GAME_STATE.ERROR;
  }
}

// ---------------------------------------------------------------------------
// Menus
// ---------------------------------------------------------------------------

/** « Retour » : Échap, ou le bouton Esquive pour une borne sans clavier. */
function retourDemande() {
  return input.justPressedRaw('Escape') || input.justPressed(1, 'dodge') || input.justPressed(2, 'dodge');
}

function validationDemandee() {
  return ['punch', 'start'].some((a) => input.justPressed(1, a) || input.justPressed(2, a));
}

function enterTitle() {
  gameState = GAME_STATE.TITLE;
  cacherTousLesMenus();
  overlayTitle.classList.remove('hidden');
}

function enterModeSelect() {
  gameState = GAME_STATE.MODE_SELECT;
  cacherTousLesMenus();
  overlayMode.classList.remove('hidden');
  renderModeUI();
}

function renderModeUI() {
  modeCards.forEach((card, i) => card.classList.toggle('selected', i === modeIndex));
}

function updateModeSelect() {
  if (retourDemande()) { enterTitle(); return; }
  if (input.justPressed(1, 'left') || input.justPressed(2, 'left')) {
    modeIndex = (modeIndex - 1 + modeCards.length) % modeCards.length;
  }
  if (input.justPressed(1, 'right') || input.justPressed(2, 'right')) {
    modeIndex = (modeIndex + 1) % modeCards.length;
  }
  renderModeUI();
  if (validationDemandee()) {
    mode = modeCards[modeIndex].dataset.mode === 'arene' ? MODE.ARENE : MODE.DUEL;
    enterSelect();
  }
}

function enterSelect() {
  selection[1].ready = false;
  selection[2].ready = false;
  roundWins = { 1: 0, 2: 0 };
  gameState = GAME_STATE.SELECT;
  cacherTousLesMenus();
  overlaySelect.classList.remove('hidden');
  // En arène, le joueur ne choisit QUE son microbiologiste : la colonne de
  // droite disparaît, les bactéries étant tirées au sort par les vagues.
  const arene = mode === MODE.ARENE;
  selectDom[2].root.hidden = arene;
  selectTitle.textContent = arene ? 'Choisis ton microbiologiste' : 'Choisis ton perso';
  renderSelectUI();
}

/** Les deux coups à montrer sur la fiche : secondaire (pied) et spéciale. */
function ficheDesCoups(char) {
  const lignes = [];
  const ajoute = (kind, move) => {
    if (!move) return;
    lignes.push({ kind, label: move.label ?? kind, damage: move.damage });
  };
  ajoute('Secondaire', char.moves.kick);
  ajoute('Spéciale', char.moves.superattack);
  return lignes;
}

function renderFiche(dom, char) {
  dom.tagline.textContent = char.tagline || '';
  dom.moves.innerHTML = '';
  for (const l of ficheDesCoups(char)) {
    const li = document.createElement('li');
    const kind = document.createElement('span');
    kind.className = 'move-kind';
    kind.textContent = l.kind;
    li.appendChild(kind);
    li.appendChild(document.createTextNode(l.label));
    if (l.damage) {
      const dmg = document.createElement('span');
      dmg.className = 'move-damage';
      dmg.textContent = ` — ${l.damage} dégâts`;
      li.appendChild(dmg);
    }
    dom.moves.appendChild(li);
  }
}

function renderSelectUI() {
  const joueurs = mode === MODE.ARENE ? [1] : [1, 2];
  for (const p of joueurs) {
    const sel = selection[p];
    const char = sel.liste[sel.index];
    const dom = selectDom[p];
    applyPreview(dom.portrait, char.portrait?.src, char.color);
    dom.name.textContent = char.displayName;
    renderFiche(dom, char);
    dom.root.classList.toggle('ready', sel.ready);
  }
}

function updateSelect() {
  if (retourDemande()) { enterModeSelect(); return; }

  const joueurs = mode === MODE.ARENE ? [1] : [1, 2];
  for (const p of joueurs) {
    const sel = selection[p];
    if (sel.ready) {
      if (input.justPressed(p, 'kick')) sel.ready = false;
      continue;
    }
    if (input.justPressed(p, 'left')) sel.index = (sel.index - 1 + sel.liste.length) % sel.liste.length;
    if (input.justPressed(p, 'right')) sel.index = (sel.index + 1) % sel.liste.length;
    if (input.justPressed(p, 'punch') || input.justPressed(p, 'start')) sel.ready = true;
  }
  renderSelectUI();

  const tousPrets = joueurs.every((p) => selection[p].ready);
  if (!tousPrets) return;

  // En arène, le décor change tout seul à chaque vague : pas de sélecteur.
  if (mode === MODE.ARENE) startArena(selection[1].liste[selection[1].index]);
  else enterStageSelect();
}

function enterStageSelect() {
  stageSelection.index = Math.max(0, stages.indexOf(stage));
  gameState = GAME_STATE.STAGE_SELECT;
  cacherTousLesMenus();
  overlayStageSelect.classList.remove('hidden');
  renderStageSelectUI();
}

function renderStageSelectUI() {
  const chosen = stages[stageSelection.index];
  applyPreview(stageSelectPreview, chosen.background?.src, stagePreviewBackground(chosen));
  stageSelectName.textContent = chosen.name || '—';
}

function updateStageSelect() {
  if (retourDemande()) { enterSelect(); return; }
  if (input.justPressed(1, 'left') || input.justPressed(2, 'left')) {
    stageSelection.index = (stageSelection.index - 1 + stages.length) % stages.length;
  }
  if (input.justPressed(1, 'right') || input.justPressed(2, 'right')) {
    stageSelection.index = (stageSelection.index + 1) % stages.length;
  }
  renderStageSelectUI();

  if (validationDemandee()) {
    startFight(
      selection[1].liste[selection[1].index],
      selection[2].liste[selection[2].index],
      stages[stageSelection.index],
    );
  }
}

// ---------------------------------------------------------------------------
// Mode 1 contre 1
// ---------------------------------------------------------------------------

function startFight(char1, char2, chosenStage) {
  stage = chosenStage;
  // La caméra doit connaître le décor avant de placer les combattants : sur un
  // décor panoramique, la manche démarre au milieu du terrain, pas au bord.
  camera.setStage(stage);
  const centre = camera.x + CANVAS_WIDTH / 2;
  fighter1 = new Fighter(char1, 1, centre - 60, 1);
  fighter2 = new Fighter(char2, 2, centre + 60, -1);
  fighter1.camera = camera;
  fighter2.camera = camera;
  camera.snapTo(fighter1, fighter2);
  timeLeft = ROUND_TIME_SECONDS;
  arena = null;
  gameState = GAME_STATE.FIGHT;
  cacherTousLesMenus();
  clearHitEffects();
  clearAllies();
}

// L'écran de résultat est en Press Start 2P, qui n'a pas de capitales
// accentuées : « ÉLIE METCHNIKOFF » y perdrait son É. Même traitement que le
// HUD du canvas, d'où la fonction partagée.
function nomEnCapitales(fighter) {
  return sansAccents(fighter.character.displayName).toUpperCase();
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
    resultText.textContent = `${nomEnCapitales(matchWinner)} GAGNE LE MATCH ! (${score})`;
    resultHint.textContent = 'Appuyez sur Entrée pour rejouer';
    gameState = GAME_STATE.RESULT;
  } else {
    resultText.textContent = winner
      ? `${nomEnCapitales(winner)} REMPORTE LA MANCHE (${score})`
      : 'MANCHE NULLE !';
    resultHint.textContent = 'Manche suivante...';
    gameState = GAME_STATE.ROUND_RESULT;
    roundResultTimer = ROUND_RESULT_DISPLAY_MS;
  }
}

function startNextRound() {
  startFight(fighter1.character, fighter2.character, stage);
}

// ---------------------------------------------------------------------------
// Mode Arène
// ---------------------------------------------------------------------------

function startArena(char) {
  camera.setStage(stage);
  const centre = camera.x + CANVAS_WIDTH / 2;
  fighter1 = new Fighter(char, 1, centre, 1);
  fighter1.camera = camera;
  fighter2 = null;
  arena = new Arena(fighter1, microbes, camera);
  timeLeft = null;
  gameState = GAME_STATE.ARENA;
  cacherTousLesMenus();
  clearHitEffects();
  clearAllies();
}

function updateArena(dt) {
  const evenement = arena.update(dt, input);
  // Le décor défile de lui-même : une vague, un décor. Le joueur ne le choisit
  // pas en arène, c'est le mode qui impose le lieu.
  if (evenement === 'vague-suivante') stageSuivant();

  const cible = arena.cibleDuJoueur();
  camera.update(fighter1, cible ?? fighter1, dt);
  updateHitEffects(dt);
  // Les lactobacilles visent le premier combattant de la liste qui n'est pas
  // leur invocateur : on ne leur présente donc que les ennemis DEBOUT.
  updateAllies(dt, [fighter1, ...arena.ennemis.filter((e) => !e.ko)]);

  if (arena.perdu || arena.termine) endArena();
}

function endArena() {
  const gagne = arena.termine && !arena.perdu;
  if (gagne) fighter1.playVictory();
  resultText.textContent = gagne
    ? `VAGUES NETTOYEES ! SCORE ${arena.score}`
    : `SUBMERGE VAGUE ${arena.numeroVague} — SCORE ${arena.score}`;
  resultHint.textContent = 'Appuyez sur Entrée pour rejouer';
  overlayResult.classList.remove('hidden');
  gameState = GAME_STATE.ARENA_RESULT;
}

// ---------------------------------------------------------------------------
// Pause
// ---------------------------------------------------------------------------

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
  enterModeSelect();
}

// ---------------------------------------------------------------------------
// Boucle
// ---------------------------------------------------------------------------

function update(dt) {
  if (stage) updateStage(stage, dt);

  const enCombat = gameState === GAME_STATE.FIGHT || gameState === GAME_STATE.ROUND_RESULT ||
    gameState === GAME_STATE.ARENA;
  if (enCombat && input.justPressedRaw('Escape')) {
    pauseFight();
    return;
  }

  if (gameState === GAME_STATE.PAUSED) {
    if (input.justPressedRaw('Escape')) resumeFight();
    else if (input.justPressed(1, 'start') || input.justPressed(2, 'start')) quitFromPause();
    return;
  }

  if (gameState === GAME_STATE.TITLE) {
    if (input.justPressed(1, 'start') || input.justPressed(2, 'start')) enterModeSelect();
    return;
  }

  if (gameState === GAME_STATE.MODE_SELECT) { updateModeSelect(); return; }
  if (gameState === GAME_STATE.SELECT) { updateSelect(); return; }
  if (gameState === GAME_STATE.STAGE_SELECT) { updateStageSelect(); return; }

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
    if (input.justPressed(1, 'start') || input.justPressed(2, 'start')) enterModeSelect();
    return;
  }

  if (gameState === GAME_STATE.ARENA_RESULT) {
    fighter1.tickAnimationOnly(dt);
    if (input.justPressed(1, 'start') || input.justPressed(2, 'start')) enterModeSelect();
    return;
  }

  if (gameState === GAME_STATE.ARENA) { updateArena(dt); return; }

  if (gameState === GAME_STATE.FIGHT) {
    fighter1.update(dt, input, fighter2);
    fighter2.update(dt, input, fighter1);
    camera.update(fighter1, fighter2, dt);
    updateHitEffects(dt);
    updateAllies(dt, [fighter1, fighter2]);

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
  drawStage(ctx, stage, camera.x);

  const enArene = arena && (gameState === GAME_STATE.ARENA || gameState === GAME_STATE.ARENA_RESULT);

  if (enArene) {
    // Les combattants et les étincelles vivent en coordonnées monde : on décale
    // le repère de la caméra avant de les dessiner. Le HUD, lui, reste fixe.
    ctx.save();
    ctx.translate(-Math.round(camera.x), 0);
    arena.dessiner(ctx);
    drawArenaEnemyBars(ctx, arena.ennemis);
    drawAllies(ctx);
    drawHitEffects(ctx);
    ctx.restore();
  } else if (fighter1 && fighter2) {
    ctx.save();
    ctx.translate(-Math.round(camera.x), 0);
    // ordre de dessin simple : le perso le plus en arrière (y le plus petit à l'écran) d'abord
    const order = fighter1.x <= fighter2.x ? [fighter1, fighter2] : [fighter2, fighter1];
    for (const f of order) f.draw(ctx);
    drawAllies(ctx);
    drawHitEffects(ctx);
    ctx.restore();
  }
  ctx.restore();

  if (enArene) {
    drawArenaHUD(ctx, fighter1, arena);
  } else if (fighter1 && fighter2) {
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
