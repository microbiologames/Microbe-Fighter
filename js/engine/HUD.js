import { CANVAS_WIDTH, MAX_HEALTH, ENERGY_MAX, ROUNDS_TO_WIN } from './Config.js';

const BAR_WIDTH = 140;
const BAR_HEIGHT = 12;
const ENERGY_HEIGHT = 5;
const ENERGY_GAP = 2;
const MARGIN = 10;
const PIP_SIZE = 5;
const PIP_GAP = 2;

export function drawHUD(ctx, fighter1, fighter2, timeLeft, roundWins) {
  const p1X = MARGIN;
  const p2X = CANVAS_WIDTH - MARGIN - BAR_WIDTH;
  const energyY = MARGIN + BAR_HEIGHT + ENERGY_GAP;
  const nameY = energyY + ENERGY_HEIGHT + 10;

  drawRoundPips(ctx, roundWins[1], p1X, MARGIN - PIP_SIZE - 2, false);
  drawRoundPips(ctx, roundWins[2], p2X + BAR_WIDTH, MARGIN - PIP_SIZE - 2, true);

  drawHealthBar(ctx, p1X, MARGIN, fighter1.health, false);
  drawHealthBar(ctx, p2X, MARGIN, fighter2.health, true);

  drawEnergyBar(ctx, p1X, energyY, fighter1.energy, false);
  drawEnergyBar(ctx, p2X, energyY, fighter2.energy, true);

  drawName(ctx, fighter1.character.displayName, p1X, nameY, 'left');
  drawName(ctx, fighter2.character.displayName, p2X + BAR_WIDTH, nameY, 'right');

  ctx.fillStyle = '#fff';
  ctx.font = '14px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(String(Math.max(0, Math.ceil(timeLeft))), CANVAS_WIDTH / 2, MARGIN + BAR_HEIGHT);
}

function drawHealthBar(ctx, x, y, health, reversed) {
  ctx.fillStyle = '#222';
  ctx.fillRect(x, y, BAR_WIDTH, BAR_HEIGHT);

  const ratio = Math.max(0, health / MAX_HEALTH);
  const w = BAR_WIDTH * ratio;
  ctx.fillStyle = ratio > 0.5 ? '#4caf50' : ratio > 0.2 ? '#ffb300' : '#e63946';
  if (reversed) {
    ctx.fillRect(x + BAR_WIDTH - w, y, w, BAR_HEIGHT);
  } else {
    ctx.fillRect(x, y, w, BAR_HEIGHT);
  }

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, BAR_WIDTH, BAR_HEIGHT);
}

function drawEnergyBar(ctx, x, y, energy, reversed) {
  ctx.fillStyle = '#222';
  ctx.fillRect(x, y, BAR_WIDTH, ENERGY_HEIGHT);

  const ratio = Math.min(1, energy / ENERGY_MAX);
  const w = BAR_WIDTH * ratio;
  ctx.fillStyle = ratio >= 1 ? '#ffd23f' : '#4a90e2';
  if (reversed) {
    ctx.fillRect(x + BAR_WIDTH - w, y, w, ENERGY_HEIGHT);
  } else {
    ctx.fillRect(x, y, w, ENERGY_HEIGHT);
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, BAR_WIDTH, ENERGY_HEIGHT);
}

function drawRoundPips(ctx, wins, edgeX, y, alignRight) {
  for (let i = 0; i < ROUNDS_TO_WIN; i++) {
    const px = alignRight
      ? edgeX - (i + 1) * PIP_SIZE - i * PIP_GAP
      : edgeX + i * (PIP_SIZE + PIP_GAP);
    ctx.fillStyle = i < wins ? '#ffd23f' : 'rgba(255,255,255,0.15)';
    ctx.fillRect(px, y, PIP_SIZE, PIP_SIZE);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, y + 0.5, PIP_SIZE, PIP_SIZE);
  }
}

// La police du jeu, Press Start 2P, n'a PAS de capitales accentuées. « Doc
// Pétri » passé en majuscules y ressortait en « DOC PéTRI » : le É manquant
// faisait tomber ce seul caractère sur une police de repli, plus petite et pas
// du tout pixel. On retire donc les diacritiques avant d'afficher — c'est la
// solution des bornes d'arcade, et « E. METCHNIKOFF » se lit très bien.
//
// Uniquement à l'affichage du canvas : les écrans HTML (sélection, écran titre)
// utilisent une autre police et gardent leurs accents.
function sansAccents(texte) {
  return texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Les noms sont affiches EN ENTIER, prenom compris. « EMMANUELLE CHARPENTIER »
// fait 22 caracteres, soit 154 px a la taille nominale de 7 px, pour une barre
// de vie qui en fait 140 : il deborderait sur celle d'en face.
//
// Plutot que d'abreger, la taille descend jusqu'a ce que le nom tienne. Press
// Start 2P est une police bitmap dessinee sur une grille de 8 px, donc on ne
// descend que par pas d'un pixel entier : a 6,5 px elle devient floue, a 6 px
// elle reste nette. En dessous de 5 px c'est illisible, et le nom est alors
// coupe plutot que reduit davantage.
const NAME_SIZE_MAX = 7;
const NAME_SIZE_MIN = 5;

function drawName(ctx, name, x, y, align) {
  const texte = sansAccents(name).toUpperCase();
  ctx.fillStyle = '#ffd23f';
  ctx.textAlign = align;

  let taille = NAME_SIZE_MAX;
  ctx.font = `${taille}px "Press Start 2P", monospace`;
  while (taille > NAME_SIZE_MIN && ctx.measureText(texte).width > BAR_WIDTH) {
    taille -= 1;
    ctx.font = `${taille}px "Press Start 2P", monospace`;
  }
  ctx.fillText(texte, x, y);
}
