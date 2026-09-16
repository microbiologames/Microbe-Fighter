// Télécharge les voix depuis les banques CC0 listées dans scripts/voices.js,
// les normalise et les écrit dans assets/audio/sfx/<perso>/<evenement>.wav.
//
// Chaque extrait est retravaillé pour qu'il s'intègre au jeu :
//   - converti en mono 44,1 kHz 16 bits (les sources vont du wav stéréo à l'ogg) ;
//   - silence de tête et de queue coupé — un son de combat doit partir à l'instant
//     où le coup touche, pas 200 ms plus tard ;
//   - crête normalisée, pour que tous les persos soient au même niveau ;
//   - fondu de 5 ms aux deux bouts, contre les claquements ;
//   - tronqué à 2,5 s : ce sont des interjections, pas des répliques.
//
// Usage :
//   node scripts/import-voices.js            # les quatre personnages
//   node scripts/import-voices.js petri      # un seul
//   node scripts/import-voices.js --list     # ce qui serait importé, sans rien écrire
//
// DÉPENDANCE : Playwright, comme prepare-reference.js — le décodage audio passe
// par le moteur du navigateur, seul moyen de lire à la fois wav, ogg et mp3 sans
// embarquer de décodeur.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { SOURCES, VOICES, EVENTS } = require('./voices');

const ROOT = path.join(__dirname, '..');
const SFX_DIR = path.join(ROOT, 'assets', 'audio', 'sfx');
const CACHE = path.join(os.tmpdir(), 'microbe-fighter-voix');

const SAMPLE_RATE = 44100;
const SILENCE_THRESHOLD = 0.012; // en dessous, on considère que c'est du silence
const PEAK_TARGET = 0.89;
const FADE_MS = 5;
const MAX_SECONDS = 2.5;

function loadPlaywright() {
  try { return require('playwright').chromium; } catch { return null; }
}

// Téléchargement, avec repli sur curl.
//
// `fetch` de Node ne lit PAS les variables HTTP_PROXY / HTTPS_PROXY : derrière un
// proxy de sortie — le cas d'une session Claude Code — la requête part en direct
// et se fait refuser, alors que la même URL passe très bien avec curl. On tente
// donc fetch d'abord (rapide, sans dépendance), puis curl, présent partout, y
// compris sur Windows 10 et suivants.
async function download(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return dest;
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 0) {
        fs.writeFileSync(dest, buf);
        return dest;
      }
    }
  } catch {
    // on bascule sur curl
  }

  try {
    execFileSync('curl', ['-sSL', '--fail', '--max-time', '180', '-A', 'Mozilla/5.0', url, '-o', dest],
                 { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (err) {
    throw new Error(`${url} : ni fetch ni curl n'ont abouti`);
  }
  if (!fs.existsSync(dest) || fs.statSync(dest).size === 0) throw new Error(`${url} : fichier vide`);
  return dest;
}

// Les packs livrés en .zip sont dépliés une fois dans le cache.
async function ensureArchive(key) {
  const src = SOURCES[key];
  const dir = path.join(CACHE, key);
  if (fs.existsSync(path.join(dir, '.ok'))) return dir;

  const zipPath = path.join(CACHE, `${key}.zip`);
  await download(src.archive, zipPath);
  fs.mkdirSync(dir, { recursive: true });

  // Décompression sans dépendance : lecture du répertoire central du zip.
  const buf = fs.readFileSync(zipPath);
  const zlib = require('zlib');
  let end = buf.length - 22;
  while (end >= 0 && buf.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw new Error(`${key} : archive illisible`);
  let offset = buf.readUInt32LE(end + 16);
  const count = buf.readUInt16LE(end + 10);

  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(offset + 10);
    const compSize = buf.readUInt32LE(offset + 20);
    const nameLen = buf.readUInt16LE(offset + 28);
    const extraLen = buf.readUInt16LE(offset + 30);
    const commentLen = buf.readUInt16LE(offset + 32);
    const localOffset = buf.readUInt32LE(offset + 42);
    const name = buf.toString('utf8', offset + 46, offset + 46 + nameLen);
    offset += 46 + nameLen + extraLen + commentLen;
    if (name.endsWith('/')) continue;

    const lnLen = buf.readUInt16LE(localOffset + 26);
    const lxLen = buf.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + lnLen + lxLen;
    const raw = buf.subarray(start, start + compSize);
    const data = method === 0 ? raw : zlib.inflateRawSync(raw);

    const out = path.join(dir, path.basename(name));
    fs.writeFileSync(out, data);
  }
  fs.writeFileSync(path.join(dir, '.ok'), '');
  return dir;
}

async function sourceFile(sourceKey, fileName) {
  const src = SOURCES[sourceKey];
  if (src.archive) {
    const dir = await ensureArchive(sourceKey);
    const p = path.join(dir, path.basename(fileName));
    if (!fs.existsSync(p)) throw new Error(`${fileName} absent de ${src.titre}`);
    return p;
  }
  return download(src.base + encodeURIComponent(fileName), path.join(CACHE, sourceKey, fileName));
}

// Tourne dans la page Chromium : décode, nettoie, ré-encode en WAV.
function processInPage({ dataUrl, sampleRate, threshold, peakTarget, fadeMs, maxSeconds }) {
  return new Promise((resolve, reject) => {
    (async () => {
      const bytes = Uint8Array.from(atob(dataUrl), (c) => c.charCodeAt(0));
      const ctx = new OfflineAudioContext(1, sampleRate, sampleRate);
      let buffer;
      try {
        buffer = await ctx.decodeAudioData(bytes.buffer);
      } catch {
        reject(new Error('décodage impossible'));
        return;
      }

      // Downmix mono.
      const n = buffer.length;
      const mono = new Float32Array(n);
      for (let c = 0; c < buffer.numberOfChannels; c++) {
        const data = buffer.getChannelData(c);
        for (let i = 0; i < n; i++) mono[i] += data[i] / buffer.numberOfChannels;
      }

      // Rééchantillonnage linéaire vers la cadence cible.
      const ratio = sampleRate / buffer.sampleRate;
      const outLen = Math.round(n * ratio);
      let s = new Float32Array(outLen);
      for (let i = 0; i < outLen; i++) {
        const pos = i / ratio;
        const i0 = Math.floor(pos);
        const frac = pos - i0;
        s[i] = (mono[i0] ?? 0) * (1 - frac) + (mono[i0 + 1] ?? 0) * frac;
      }

      // Coupe du silence de tête et de queue.
      let start = 0; while (start < s.length && Math.abs(s[start]) < threshold) start++;
      let end = s.length - 1; while (end > start && Math.abs(s[end]) < threshold) end--;
      if (end <= start) { start = 0; end = s.length - 1; }
      s = s.slice(start, Math.min(end + 1, start + Math.round(maxSeconds * sampleRate)));

      // Normalisation de crête.
      let peak = 0;
      for (let i = 0; i < s.length; i++) peak = Math.max(peak, Math.abs(s[i]));
      const gain = peak > 0 ? peakTarget / peak : 1;

      // Fondus aux extrémités.
      const fade = Math.min(Math.round((fadeMs / 1000) * sampleRate), Math.floor(s.length / 2));
      const out = new Int16Array(s.length);
      for (let i = 0; i < s.length; i++) {
        let v = s[i] * gain;
        if (i < fade) v *= i / fade;
        else if (i >= s.length - fade) v *= (s.length - 1 - i) / fade;
        out[i] = Math.max(-32768, Math.min(32767, Math.round(v * 32767)));
      }

      // En-tête WAV PCM 16 bits mono.
      const header = new ArrayBuffer(44);
      const dv = new DataView(header);
      const put = (o, str) => { for (let i = 0; i < str.length; i++) dv.setUint8(o + i, str.charCodeAt(i)); };
      put(0, 'RIFF'); dv.setUint32(4, 36 + out.length * 2, true); put(8, 'WAVE');
      put(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
      dv.setUint32(24, sampleRate, true); dv.setUint32(28, sampleRate * 2, true);
      dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
      put(36, 'data'); dv.setUint32(40, out.length * 2, true);

      const wav = new Uint8Array(44 + out.length * 2);
      wav.set(new Uint8Array(header), 0);
      wav.set(new Uint8Array(out.buffer), 44);

      let bin = '';
      const CHUNK = 0x8000;
      for (let i = 0; i < wav.length; i += CHUNK) bin += String.fromCharCode(...wav.subarray(i, i + CHUNK));
      resolve({
        base64: btoa(bin),
        secondes: Number((s.length / sampleRate).toFixed(2)),
        creteOrigine: Number(peak.toFixed(3)),
        coupeDebut: Number((start / sampleRate).toFixed(2)),
      });
    })().catch(reject);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const listOnly = args.includes('--list');
  const wanted = args.filter((a) => !a.startsWith('--'));
  const characters = wanted.length ? wanted : Object.keys(VOICES);

  const unknown = characters.filter((c) => !VOICES[c]);
  if (unknown.length) {
    console.error(`Perso inconnu : ${unknown.join(', ')}. Connus : ${Object.keys(VOICES).join(', ')}`);
    process.exit(1);
  }

  if (listOnly) {
    for (const c of characters) {
      console.log(`${c} (${VOICES[c].voix})`);
      for (const e of EVENTS) {
        const [src, file] = VOICES[c][e];
        console.log(`  ${e.padEnd(12)} ${file.padEnd(34)} ${SOURCES[src].titre} [${SOURCES[src].licence}]`);
      }
    }
    return;
  }

  const chromium = loadPlaywright();
  if (!chromium) {
    console.error('Playwright est introuvable : npm install playwright && npx playwright install chromium');
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  let written = 0;
  const failures = [];

  for (const c of characters) {
    console.log(`\n${c} — voix ${VOICES[c].voix}`);
    for (const e of EVENTS) {
      const [srcKey, fileName] = VOICES[c][e];
      try {
        const src = await sourceFile(srcKey, fileName);
        const b64 = fs.readFileSync(src).toString('base64');
        const r = await page.evaluate(processInPage, {
          dataUrl: b64, sampleRate: SAMPLE_RATE, threshold: SILENCE_THRESHOLD,
          peakTarget: PEAK_TARGET, fadeMs: FADE_MS, maxSeconds: MAX_SECONDS,
        });
        const dest = path.join(SFX_DIR, c, `${e}.wav`);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, Buffer.from(r.base64, 'base64'));
        console.log(`  ${e.padEnd(12)} ${r.secondes}s  (crête source ${r.creteOrigine}, ${r.coupeDebut}s coupés au début)  <- ${fileName}`);
        written++;
      } catch (err) {
        console.error(`  ${e.padEnd(12)} ÉCHEC : ${err.message}`);
        failures.push(`${c}/${e}`);
      }
    }
  }

  await browser.close();
  console.log(`\n${written} fichier(s) écrit(s).`);
  if (failures.length) {
    console.error(`Échecs : ${failures.join(', ')}`);
    process.exit(1);
  }
  console.log('Contrôle : node scripts/check-assets.js');
}

main().catch((err) => {
  console.error('ERREUR:', err.message);
  process.exit(1);
});
