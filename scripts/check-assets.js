// Vérifie que le contenu du dépôt est cohérent avec les manifestes, sans rien
// générer ni appeler d'API. C'est le garde-fou contre les deux bugs du jeu
// d'origine : un personnage dont une animation déclarée n'a pas de dossier, et
// un décor listé dans STAGE_FILES dont le background.png n'existe pas.
//
// Usage : node scripts/check-assets.js
//
// Les sprites absents ne sont PAS une erreur tant qu'ils ne sont pas générés :
// ils sont listés comme "à faire". Le script ne sort en code 1 que sur une
// vraie incohérence.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CHAR_DIR = path.join(ROOT, 'js', 'data', 'characters');
const STAGE_DIR = path.join(ROOT, 'js', 'data', 'stages');

const errors = [];
const todo = [];
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

// --- Personnages -----------------------------------------------------------

for (const file of fs.readdirSync(CHAR_DIR).filter((f) => f.endsWith('.json'))) {
  const char = readJson(path.join(CHAR_DIR, file));
  const label = char.displayName || char.id;

  for (const [moveName, move] of Object.entries(char.moves || {})) {
    if (!char.animations?.[move.animation]) {
      errors.push(`${file} : le coup "${moveName}" utilise l'animation "${move.animation}" qui n'est pas déclarée`);
    }
  }

  for (const [animName, anim] of Object.entries(char.animations || {})) {
    const folder = path.join(ROOT, anim.folder);
    if (!fs.existsSync(folder)) {
      errors.push(`${file} : dossier manquant pour "${animName}" -> ${anim.folder}`);
      continue;
    }
    const frames = fs.readdirSync(folder).filter((f) => /^\d{3}\.png$/.test(f)).sort();
    if (frames.length === 0) {
      todo.push(`${label} / ${animName} : aucune frame (placeholder à l'écran)`);
      continue;
    }
    if (frames.length !== anim.frameCount) {
      errors.push(`${file} : "${animName}" déclare frameCount=${anim.frameCount} mais ${frames.length} frame(s) sur le disque`);
    }
    // La numérotation doit être continue à partir de 000, sinon le moteur
    // charge du vide au milieu de l'animation.
    for (let i = 0; i < frames.length; i++) {
      const expected = `${String(i).padStart(3, '0')}.png`;
      if (frames[i] !== expected) {
        errors.push(`${file} : "${animName}" a un trou de numérotation (attendu ${expected}, trouvé ${frames[i]})`);
        break;
      }
    }
  }

  if (char.portrait && !fs.existsSync(path.join(ROOT, char.portrait))) {
    todo.push(`${label} / portrait : ${char.portrait} absent`);
  }
  for (const [event, src] of Object.entries(char.sfx || {})) {
    if (!fs.existsSync(path.join(ROOT, src))) todo.push(`${label} / son "${event}" : ${src} absent`);
  }
}

// --- Décors ----------------------------------------------------------------

const mainJs = fs.readFileSync(path.join(ROOT, 'js', 'main.js'), 'utf8');
const stageListMatch = mainJs.match(/const STAGE_FILES = \[([\s\S]*?)\];/);
if (!stageListMatch) {
  errors.push('js/main.js : impossible de lire STAGE_FILES');
} else {
  const listed = [...stageListMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

  for (const slug of listed) {
    const manifest = path.join(STAGE_DIR, `${slug}.json`);
    if (!fs.existsSync(manifest)) {
      errors.push(`STAGE_FILES liste "${slug}" mais js/data/stages/${slug}.json n'existe pas`);
      continue;
    }
    const stage = readJson(manifest);
    if (stage.background && !fs.existsSync(path.join(ROOT, stage.background))) {
      // Pas une erreur : le moteur dessine le fond de repli issu de "palette".
      // Ça en devient une si le manifeste n'a pas de palette non plus.
      if (stage.palette) todo.push(`Décor ${stage.name} : ${stage.background} absent (fond de repli utilisé)`);
      else errors.push(`Décor ${slug} : ni background.png ni "palette" — le décor serait vide`);
    }
  }

  const onDisk = fs.readdirSync(STAGE_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
  for (const slug of onDisk) {
    if (!listed.includes(slug)) todo.push(`Décor ${slug} : manifeste présent mais absent de STAGE_FILES`);
  }
}

// --- Musiques --------------------------------------------------------------

for (const track of ['title-screen', 'ambient-theme', 'combat-low-hp', 'victory']) {
  const wav = path.join(ROOT, 'assets', 'audio', 'music', `${track}.wav`);
  if (!fs.existsSync(wav)) todo.push(`Musique ${track}.wav absente (le jeu tourne en silence sur cette piste)`);
}

// --- Rapport ---------------------------------------------------------------

if (todo.length) {
  console.log(`À faire (${todo.length}) — le jeu tourne quand même :`);
  for (const t of todo) console.log(`  · ${t}`);
  console.log('');
}

if (errors.length) {
  console.error(`Incohérences (${errors.length}) :`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

console.log('Aucune incohérence : manifestes, dossiers et numérotation des frames sont alignés.');
