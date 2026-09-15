// Mesure les sprites générés et corrige les deux valeurs du manifeste qu'on ne
// peut pas deviner avant de les avoir sous les yeux :
//
//   groundY  la rangée de pixels, DANS L'IMAGE SOURCE, où les pieds touchent le
//            sol. C'est le piège classique : les exports Pixellab ont du vide
//            transparent sous le personnage, et sans cette valeur il flotte ou
//            s'enfonce dans le sol.
//   scale    le facteur d'agrandissement. La hauteur à l'écran vaut
//            hauteur_du_perso_dans_l_image x scale, et on veut qu'elle
//            corresponde à hurtbox.heightStand — sinon la boîte de collision
//            ne colle pas à ce qu'on voit.
//
// Le script décode les PNG lui-même (zlib est dans Node, aucune dépendance).
//
// Usage :
//   node scripts/measure-sprites.js              # mesure et affiche
//   node scripts/measure-sprites.js --write      # mesure et corrige les manifestes
//   node scripts/measure-sprites.js gram --write # un seul perso

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const CHAR_DIR = path.join(ROOT, 'js', 'data', 'characters');
const ALPHA_THRESHOLD = 8;

// --- Décodeur PNG minimal (couleur vraie + alpha, 8 bits, non entrelacé) ----

function decodePng(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file} n'est pas un PNG`);

  let pos = 8;
  let width, height, bitDepth, colorType, interlace;
  const idat = [];

  while (pos < buf.length) {
    const length = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + length;
  }

  if (bitDepth !== 8) throw new Error(`${file} : profondeur ${bitDepth} bits non gérée`);
  if (interlace) throw new Error(`${file} : PNG entrelacé non géré`);
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`${file} : type de couleur ${colorType} non géré`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(height * stride);
  let prev = Buffer.alloc(stride);
  let offset = 0;

  for (let y = 0; y < height; y++) {
    const filter = raw[offset++];
    const line = Buffer.from(raw.subarray(offset, offset + stride));
    offset += stride;

    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? line[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      switch (filter) {
        case 1: line[x] = (line[x] + a) & 0xff; break;
        case 2: line[x] = (line[x] + b) & 0xff; break;
        case 3: line[x] = (line[x] + ((a + b) >> 1)) & 0xff; break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          line[x] = (line[x] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
          break;
        }
        default: break; // 0 : aucun filtre
      }
    }
    line.copy(pixels, y * stride);
    prev = line;
  }

  return { width, height, channels, pixels, hasAlpha: colorType === 4 || colorType === 6 };
}

// Boîte englobante du contenu non transparent.
function contentBounds(png) {
  const { width, height, channels, pixels, hasAlpha } = png;
  if (!hasAlpha) return { minX: 0, minY: 0, maxX: width - 1, maxY: height - 1 };

  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[y * width * channels + x * channels + channels - 1] > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { minX, minY, maxX, maxY };
}

// Ligne des pieds de chaque animation. Pixellab garde normalement le même
// canevas et la même ligne de sol d'une animation à l'autre, mais pas toujours :
// si une animation a ses pieds 10 px plus haut, le perso saute verticalement au
// moment où le coup part. Mieux vaut le voir ici qu'en jouant.
function groundLinePerAnimation(manifest) {
  const rows = [];
  for (const [name, anim] of Object.entries(manifest.animations)) {
    const folder = path.join(ROOT, anim.folder);
    if (!fs.existsSync(folder)) continue;
    const frames = fs.readdirSync(folder).filter((f) => /^\d{3}\.png$/.test(f)).sort();
    if (!frames.length) continue;
    const feet = [];
    for (const frame of frames) {
      const bounds = contentBounds(decodePng(path.join(folder, frame)));
      if (bounds) feet.push(bounds.maxY);
    }
    if (feet.length) rows.push({ name, min: Math.min(...feet), max: Math.max(...feet) });
  }
  return rows;
}

// --- Mesure d'un personnage ------------------------------------------------

function measure(charKey) {
  const manifestPath = path.join(CHAR_DIR, `${charKey}.json`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const idle = path.join(ROOT, manifest.animations.idle.folder, '000.png');
  if (!fs.existsSync(idle)) return { charKey, manifest, manifestPath, error: 'idle/000.png absent' };

  const png = decodePng(idle);
  const bounds = contentBounds(png);
  if (!bounds) return { charKey, manifest, manifestPath, error: 'idle/000.png entièrement transparent' };

  const bodyHeight = bounds.maxY - bounds.minY + 1;
  const bodyWidth = bounds.maxX - bounds.minX + 1;
  const targetHeight = manifest.hurtbox?.heightStand ?? bodyHeight;

  return {
    charKey, manifest, manifestPath, png, bounds, bodyHeight, bodyWidth,
    groundY: bounds.maxY,
    scale: Number((targetHeight / bodyHeight).toFixed(3)),
    targetHeight,
  };
}

function applyToManifest(result, perAnimation) {
  let raw = fs.readFileSync(result.manifestPath, 'utf8');
  // Le groundY du personnage sert de valeur par défaut ; il reste utile pour
  // une animation qu'on n'a pas encore générée.
  raw = raw.replace(/"groundY":\s*[\d.]+/, `"groundY": ${result.groundY}`);
  raw = raw.replace(/"scale":\s*[\d.]+/, `"scale": ${result.scale}`);

  // Puis un groundY par animation, injecté juste après son "loop".
  for (const row of perAnimation) {
    const entry = new RegExp(`("${row.name}":\\s*\\{[^}]*?"loop":\\s*(?:true|false))(,\\s*"groundY":\\s*\\d+)?`);
    if (!entry.test(raw)) continue;
    raw = raw.replace(entry, `$1, "groundY": ${row.max}`);
  }

  JSON.parse(raw); // garde-fou : on ne réécrit jamais un JSON cassé
  fs.writeFileSync(result.manifestPath, raw);
}

function main() {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const verbose = args.includes('--per-animation');
  const names = args.filter((a) => !a.startsWith('--'));

  const keys = names.length
    ? names
    : fs.readdirSync(CHAR_DIR).filter((f) => f.endsWith('.json')).map((f) => path.basename(f, '.json'));

  let changed = 0;
  for (const key of keys) {
    const r = measure(key);
    if (r.error) {
      console.log(`${key.padEnd(9)} ${r.error}`);
      continue;
    }
    const before = { scale: r.manifest.scale, groundY: r.manifest.groundY };
    const same = before.scale === r.scale && before.groundY === r.groundY;

    console.log(
      `${r.charKey.padEnd(9)} image ${r.png.width}x${r.png.height} | ` +
      `perso ${r.bodyWidth}x${r.bodyHeight} px | pieds y=${r.groundY}\n` +
      `${''.padEnd(9)} groundY ${before.groundY} -> ${r.groundY} | ` +
      `scale ${before.scale} -> ${r.scale} ` +
      `(hauteur à l'écran ${Math.round(r.bodyHeight * r.scale)} px, visé ${r.targetHeight})` +
      (same ? '  [déjà à jour]' : '')
    );

    // Une ligne de sol qui bouge d'une animation à l'autre fait sauter le perso
    // verticalement quand le coup part : on le signale toujours, et --per-animation
    // détaille le coupable.
    const rows = groundLinePerAnimation(r.manifest);
    const allFeet = rows.flatMap((row) => [row.min, row.max]);
    const spread = allFeet.length ? Math.max(...allFeet) - Math.min(...allFeet) : 0;
    if (spread > 6) {
      console.log(
        `${''.padEnd(9)} ligne de sol variable sur ${spread} px selon l'animation ` +
        `— un "groundY" par animation sera écrit`
      );
    }
    if (verbose) {
      for (const row of rows) {
        const flag = row.max - r.groundY > 6 || r.groundY - row.min > 6 ? '  ⚠' : '';
        const range = row.min === row.max ? `${row.min}` : `${row.min}-${row.max}`;
        console.log(`${''.padEnd(11)}${row.name.padEnd(12)} pieds y=${range}${flag}`);
      }
    }

    if (write) {
      applyToManifest(r, rows);
      changed++;
    }
  }

  if (write) {
    console.log(changed ? `\n${changed} manifeste(s) mis à jour.` : '\nRien à changer.');
  } else {
    console.log('\nRelance avec --write pour appliquer ces valeurs aux manifestes.');
  }
}

main();
