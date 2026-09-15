// Briques communes aux scripts de génération Pixellab : clé d'API, appels HTTP,
// sondage des jobs et téléchargement des frames au bon endroit.
//
// La clé est cherchée dans cet ordre :
//   1. la variable d'environnement PIXELLAB_API_KEY
//      (c'est le cas dans une session Claude Code : la clé est stockée sur
//      l'environnement cloud, elle n'a pas à être écrite sur le disque)
//   2. un fichier `.env` à la racine du projet, JAMAIS versionné :
//        PIXELLAB_API_KEY=xxxxxxxxxxxxxxxx
//      (c'est le cas sur une machine perso)

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const API = 'https://api.pixellab.ai/v2';

function loadApiKey() {
  if (process.env.PIXELLAB_API_KEY) return process.env.PIXELLAB_API_KEY.trim();

  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    const match = fs.readFileSync(envPath, 'utf8').match(/PIXELLAB_API_KEY=(.+)/);
    if (match) return match[1].trim();
    throw new Error('Le fichier .env ne contient pas de ligne PIXELLAB_API_KEY=...');
  }

  throw new Error(
    'Clé Pixellab introuvable.\n' +
    '  · soit exporte PIXELLAB_API_KEY dans ton shell\n' +
    `  · soit crée ${envPath} avec la ligne : PIXELLAB_API_KEY=ta_cle\n` +
    'Le .env est dans .gitignore, il ne partira jamais sur GitHub.'
  );
}

let cachedKey = null;
function apiKey() {
  if (!cachedKey) cachedKey = loadApiKey();
  return cachedKey;
}

async function api(method, urlPath, body) {
  const res = await fetch(API + urlPath, {
    method,
    headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${urlPath} -> ${res.status}: ${await res.text()}`);
  return res.json();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Le service a régulièrement des erreurs transitoires (502, coupure réseau) sur
// des sondages qui durent plusieurs minutes. On les encaisse et on continue :
// seul un statut "failed" renvoyé par l'API est une vraie fin de job.
async function pollJob(jobId, label) {
  let consecutiveErrors = 0;
  for (;;) {
    let job;
    try {
      job = await api('GET', `/background-jobs/${jobId}`);
      consecutiveErrors = 0;
    } catch (err) {
      consecutiveErrors++;
      console.warn(`[${label}] erreur de sondage transitoire (${consecutiveErrors}) : ${err.message}`);
      await sleep(Math.min(30000, 5000 * consecutiveErrors));
      continue;
    }
    if (job.status === 'completed') return job;
    if (job.status === 'failed') {
      throw new Error(`Job ${label} (${jobId}) a échoué: ${JSON.stringify(job.last_response)}`);
    }
    await sleep(4000);
  }
}

// Écrit les frames sous la convention attendue par le moteur :
// <destFolder>/000.png, 001.png, ... (numérotation sur 3 chiffres, à partir de 0)
async function downloadFrames(urls, destFolder) {
  fs.mkdirSync(destFolder, { recursive: true });
  for (let i = 0; i < urls.length; i++) {
    const res = await fetch(urls[i]);
    if (!res.ok) throw new Error(`Téléchargement de ${urls[i]} -> ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(destFolder, `${String(i).padStart(3, '0')}.png`), buf);
  }
}

// Les réponses de job de Pixellab embarquent les images en base64, en plus de
// les publier sur son CDN (backblaze.pixellab.ai). On préfère TOUJOURS le
// base64 : c'est une requête de moins, et surtout le CDN est un domaine
// distinct, qui peut être bloqué là où api.pixellab.ai est autorisé.
function writeBase64Image(base64, destFile) {
  fs.mkdirSync(path.dirname(destFile), { recursive: true });
  fs.writeFileSync(destFile, Buffer.from(base64, 'base64'));
}

// Écrit une série d'images de job sous la convention du moteur :
// <destFolder>/000.png, 001.png, ... et efface les frames devenues en trop
// si la nouvelle animation en compte moins que la précédente.
function writeBase64Frames(images, destFolder) {
  fs.mkdirSync(destFolder, { recursive: true });
  for (const existing of fs.readdirSync(destFolder).filter((f) => /^\d{3}\.png$/.test(f))) {
    fs.unlinkSync(path.join(destFolder, existing));
  }
  images.forEach((img, i) => {
    writeBase64Image(img.base64, path.join(destFolder, `${String(i).padStart(3, '0')}.png`));
  });
  return images.length;
}

async function downloadImage(url, destFile) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Téléchargement de ${url} -> ${res.status}`);
  fs.mkdirSync(path.dirname(destFile), { recursive: true });
  fs.writeFileSync(destFile, Buffer.from(await res.arrayBuffer()));
}

// Les images de référence sont rangées par nature :
//   references/personnages/<id>.jpg   les persos
//   references/decors/<slug>.jpg      les décors
// et leurs versions recadrées pour l'API, produites par prepare-reference.js :
//   references/prepared/personnages/<id>.png
//   references/prepared/decors/<slug>.png
// On préfère toujours la version préparée : l'API refuse les images de plus de
// 1024x1024, et un cadrage serré donne un bien meilleur résultat.
const REFERENCE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];

function findReferenceImage(kind, name) {
  const dirs = [
    path.join(ROOT, 'references', 'prepared', kind),
    path.join(ROOT, 'references', kind),
    path.join(ROOT, 'references'), // ancienne disposition, à plat
  ];
  for (const dir of dirs) {
    for (const ext of REFERENCE_EXTENSIONS) {
      const p = path.join(dir, name + ext);
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

// Les scripts acceptent soit un character_id Pixellab, soit le NOM du personnage
// tel qu'il apparaît dans Pixellab — pratique quand le perso a été créé dans
// l'éditeur et qu'on n'a que son nom sous la main.
async function resolveCharacterId(idOrName) {
  if (/^[0-9a-f]{8}-[0-9a-f-]{20,}$/i.test(idOrName)) return idOrName;

  const list = await api('GET', '/characters');
  const characters = Array.isArray(list) ? list : list.characters || [];
  const wanted = idOrName.trim().toLowerCase();
  const match = characters.find((c) => (c.name || c.display_name || '').trim().toLowerCase() === wanted);
  if (!match) {
    const names = characters.map((c) => c.name || c.display_name).filter(Boolean);
    throw new Error(
      `Aucun personnage Pixellab nommé "${idOrName}".\n` +
      (names.length ? `Personnages disponibles :\n  - ${names.join('\n  - ')}` : 'Aucun personnage sur le compte.')
    );
  }
  return match.id || match.character_id;
}

module.exports = {
  ROOT, API, api, sleep, pollJob, findReferenceImage, REFERENCE_EXTENSIONS,
  writeBase64Image, writeBase64Frames,
  downloadFrames, downloadImage, resolveCharacterId,
};
