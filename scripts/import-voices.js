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
// Un événement peut empiler PLUSIEURS extraits (voir le format dans voices.js) :
// chaque couche est transposée, décalée de quelques dizaines de millisecondes et
// mélangée aux autres. C'est ce qui donne à S. aureus sa voix de grappe — une
// poignée de petites voix qui parlent en même temps, parce que le personnage est
// littéralement plusieurs coques.
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
const ECART_COUCHE_MS = 30; // décalage par défaut entre deux couches empilées

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

    // On conserve l'ARBORESCENCE de l'archive. Écrire tout à plat avec
    // basename() paraît plus simple, mais écrase les homonymes : le pack de voix
    // féminines contient trois voix (Type 1, 2 et 3) aux fichiers identiquement
    // nommés, et deux d'entre elles disparaissaient silencieusement, la
    // survivante dépendant de l'ordre du zip.
    //
    // `name` vient du zip, donc d'une source externe : on vérifie qu'il ne sort
    // pas du dossier de destination avant d'écrire quoi que ce soit.
    const out = path.resolve(dir, name);
    if (out !== dir && !out.startsWith(dir + path.sep)) {
      console.warn(`  entrée ignorée, chemin suspect : ${name}`);
      continue;
    }
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, data);
  }
  fs.writeFileSync(path.join(dir, '.ok'), '');
  return dir;
}

// Résout un fichier d'archive. `fileName` est relatif au `prefixe` de la source
// — ce qui permet d'écrire 'Type 2/attack1.wav' pour aller chercher une autre
// voix du même pack. On tolère aussi un chemin déjà complet.
async function sourceFile(sourceKey, fileName) {
  const src = SOURCES[sourceKey];
  if (src.archive) {
    const dir = await ensureArchive(sourceKey);
    // Trois chemins possibles, du plus specifique au plus general : le prefixe
    // de la source, puis son DOSSIER PARENT (qui permet d'ecrire
    // 'Type 2/attack1.wav' quand le prefixe pointe sur Type 1), puis la racine.
    const parent = path.dirname(src.prefixe || '.');
    for (const candidate of [path.join(src.prefixe || '', fileName), path.join(parent, fileName), fileName]) {
      const p = path.resolve(dir, candidate);
      if ((p === dir || p.startsWith(dir + path.sep)) && fs.existsSync(p)) return p;
    }
    throw new Error(`${fileName} absent de ${src.titre}`);
  }
  return download(src.base + encodeURIComponent(fileName), path.join(CACHE, sourceKey, fileName));
}

// Tourne dans la page Chromium : décode chaque couche, la transpose, la nettoie,
// mélange le tout et ré-encode en WAV.
//
// Une seule couche, c'est le cas courant : un extrait nettoyé, rien de plus.
// Plusieurs couches, c'est la voix de grappe : chacune est jouée à une vitesse
// différente — lire un son 1,5 fois plus vite le monte de 7 demi-tons et le
// raccourcit d'autant, ce qui fait une voix plus petite ET plus vive — puis
// décalée dans le temps pour que les entrées ne tombent pas toutes ensemble.
function processInPage({ couches, sampleRate, threshold, peakTarget, fadeMs, maxSeconds }) {
  return new Promise((resolve, reject) => {
    (async () => {
      const ctx = new OfflineAudioContext(1, sampleRate, sampleRate);
      const rendues = [];

      for (const couche of couches) {
        const bytes = Uint8Array.from(atob(couche.dataUrl), (c) => c.charCodeAt(0));
        let buffer;
        try {
          buffer = await ctx.decodeAudioData(bytes.buffer);
        } catch {
          reject(new Error(`décodage impossible : ${couche.nom}`));
          return;
        }

        // Downmix mono.
        const n = buffer.length;
        const mono = new Float32Array(n);
        for (let c = 0; c < buffer.numberOfChannels; c++) {
          const data = buffer.getChannelData(c);
          for (let i = 0; i < n; i++) mono[i] += data[i] / buffer.numberOfChannels;
        }

        // Rééchantillonnage linéaire vers la cadence cible, vitesse de lecture
        // comprise : `vitesse` vaut 1 sans transposition, 2 une octave au-dessus.
        const vitesse = Math.pow(2, (couche.demiTons || 0) / 12);
        const ratio = sampleRate / (buffer.sampleRate * vitesse);
        const outLen = Math.max(1, Math.round(n * ratio));
        let s = new Float32Array(outLen);
        for (let i = 0; i < outLen; i++) {
          const pos = i / ratio;
          const i0 = Math.floor(pos);
          const frac = pos - i0;
          s[i] = (mono[i0] ?? 0) * (1 - frac) + (mono[i0 + 1] ?? 0) * frac;
        }

        // Coupe du silence de tête et de queue.
        let debut = 0; while (debut < s.length && Math.abs(s[debut]) < threshold) debut++;
        let fin = s.length - 1; while (fin > debut && Math.abs(s[fin]) < threshold) fin--;
        if (fin <= debut) { debut = 0; fin = s.length - 1; }
        s = s.slice(debut, Math.min(fin + 1, debut + Math.round(maxSeconds * sampleRate)));

        let crete = 0;
        for (let i = 0; i < s.length; i++) crete = Math.max(crete, Math.abs(s[i]));

        rendues.push({
          echantillons: s,
          crete,
          gainCouche: couche.gain ?? 1,
          decalage: Math.round((couche.decalageMs || 0) / 1000 * sampleRate),
          coupeDebut: debut / sampleRate,
        });
      }

      // Longueur du mélange : celle du plus long, décalage compris, plafonnée.
      const plafond = Math.round(maxSeconds * sampleRate);
      const total = Math.min(
        plafond,
        Math.max(...rendues.map((r) => r.decalage + r.echantillons.length))
      );

      // Une seule couche : rien à mélanger, et surtout aucun calcul intermédiaire
      // — le gain est appliqué en un seul produit plus bas. C'est ce qui garantit
      // que l'ajout de l'empilement n'a rien changé aux voix existantes, au bit
      // près.
      //
      // Plusieurs couches : chacune est d'abord ramenée à un niveau commun, la
      // première portant le son et les suivantes remplissant derrière. Sans cette
      // égalisation, un extrait deux fois plus fort que les autres écrase la
      // grappe et la normalisation finale ne rattrape que le niveau, pas
      // l'équilibre.
      let mix;
      if (rendues.length === 1) {
        mix = rendues[0].echantillons;
      } else {
        mix = new Float32Array(total);
        for (const r of rendues) {
          const g = (r.crete > 0 ? 1 / r.crete : 1) * r.gainCouche;
          const limite = Math.min(r.echantillons.length, total - r.decalage);
          for (let i = 0; i < limite; i++) mix[r.decalage + i] += r.echantillons[i] * g;
        }
      }

      // Normalisation de crête du mélange.
      let peak = 0;
      for (let i = 0; i < total; i++) peak = Math.max(peak, Math.abs(mix[i]));
      const gain = peak > 0 ? peakTarget / peak : 1;

      // Fondus aux extrémités.
      const fade = Math.min(Math.round((fadeMs / 1000) * sampleRate), Math.floor(total / 2));
      const out = new Int16Array(total);
      for (let i = 0; i < total; i++) {
        let v = mix[i] * gain;
        if (i < fade) v *= i / fade;
        else if (i >= total - fade) v *= (total - 1 - i) / fade;
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
        secondes: Number((total / sampleRate).toFixed(2)),
        creteOrigine: Number(rendues[0].crete.toFixed(3)),
        coupeDebut: Number(rendues[0].coupeDebut.toFixed(2)),
      });
    })().catch(reject);
  });
}

// Un événement est soit `[source, fichier]`, soit une liste de couches
// `[source, fichier, demiTons, decalageMs]`. On ramène les deux à une liste.
function couchesDe(valeur) {
  const liste = Array.isArray(valeur[0]) ? valeur : [valeur];
  return liste.map(([source, fichier, demiTons = 0, decalageMs], i) => ({
    source,
    fichier,
    demiTons,
    decalageMs: decalageMs ?? i * ECART_COUCHE_MS,
    // La première couche domine, les suivantes s'effacent progressivement.
    gain: 1 / Math.sqrt(i + 1),
  }));
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
        for (const [i, k] of couchesDe(VOICES[c][e]).entries()) {
          const etiquette = i === 0 ? e : '';
          const transpose = k.demiTons ? `+${k.demiTons} demi-tons` : '';
          console.log(
            `  ${etiquette.padEnd(12)} ${k.fichier.padEnd(30)} ${transpose.padEnd(14)} ` +
            `${SOURCES[k.source].titre} [${SOURCES[k.source].licence}]`
          );
        }
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
      const couches = couchesDe(VOICES[c][e]);
      try {
        const prepared = [];
        for (const k of couches) {
          const src = await sourceFile(k.source, k.fichier);
          prepared.push({
            nom: k.fichier,
            dataUrl: fs.readFileSync(src).toString('base64'),
            demiTons: k.demiTons,
            decalageMs: k.decalageMs,
            gain: k.gain,
          });
        }
        const r = await page.evaluate(processInPage, {
          couches: prepared, sampleRate: SAMPLE_RATE, threshold: SILENCE_THRESHOLD,
          peakTarget: PEAK_TARGET, fadeMs: FADE_MS, maxSeconds: MAX_SECONDS,
        });
        const dest = path.join(SFX_DIR, c, `${e}.wav`);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, Buffer.from(r.base64, 'base64'));
        const provenance = couches.length === 1
          ? couches[0].fichier
          : `${couches.length} couches : ${couches.map((k) => `${k.fichier} +${k.demiTons}`).join(', ')}`;
        console.log(`  ${e.padEnd(12)} ${r.secondes}s  (crête source ${r.creteOrigine}, ${r.coupeDebut}s coupés au début)  <- ${provenance}`);
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
