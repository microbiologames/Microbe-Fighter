// Serveur de la borne d'arcade : UN seul port, le menu a la racine et un jeu
// par prefixe. Un seul port parce que les jeux tournent dans une iframe du
// menu : deux ports feraient deux origines, et le menu ne pourrait plus ni
// lire les manettes de l'iframe ni y voir les touches passer.
//
// Usage : node serveur.js [port]   (par defaut : 8080)
//
// Les racines des jeux sont declarees dans jeux.json, en PLUSIEURS candidats
// essayes dans l'ordre : le poste de developpement et la borne n'ont pas la
// meme disposition, et personne ne doit avoir a editer un fichier sur place
// un jour d'exposition. Le serveur ecrit au demarrage ce qu'il a retenu —
// une racine devinee en silence est une panne qu'on ne voit qu'une fois le
// public devant.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2]) || 8080;
const ICI = __dirname;
// BORNE_CONF permet de servir une AUTRE configuration sans toucher au
// fichier du depot : c'est ce qui permet au banc de verifier le cas « un jeu
// manque », et ce qui permet d'essayer une variante sur la borne sans
// modifier ce qui est versionne.
const CHEMIN_CONF = process.env.BORNE_CONF || path.join(ICI, 'jeux.json');
const CONF = JSON.parse(fs.readFileSync(CHEMIN_CONF, 'utf8'));

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.css': 'text/css', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
  '.wav': 'audio/wav', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

/** Les jeux reellement trouves sur ce poste, prefixe -> racine absolue. */
const montages = new Map();
for (const jeu of CONF.jeux) {
  const trouvee = (jeu.racines || []).map((r) => path.resolve(ICI, r))
    .find((r) => fs.existsSync(path.join(r, 'index.html')));
  const prefixe = `/jeux/${jeu.id}/`;
  if (trouvee) {
    montages.set(prefixe, trouvee);
    console.log(`  ${prefixe} -> ${trouvee}`);
  } else {
    console.log(`  ${prefixe} -> INTROUVABLE (racines essayees : ${(jeu.racines || []).join(', ')})`);
  }
}
if (montages.size < CONF.jeux.length) {
  console.log('  ATTENTION : un jeu manque. Le menu affichera sa tuile barree.');
}

/** Resout une URL en fichier, ou null si elle sort de sa racine. */
function resoudre(urlPath) {
  for (const [prefixe, racine] of montages) {
    if (urlPath === prefixe.slice(0, -1)) return { redirige: prefixe };
    if (urlPath.startsWith(prefixe)) {
      const reste = urlPath.slice(prefixe.length) || 'index.html';
      const fichier = path.resolve(racine, reste.endsWith('/') ? reste + 'index.html' : reste);
      // Sortir de la racine du jeu est refuse, et le separateur final compte :
      // sans lui, « /srv/jeu-secret » passerait pour « /srv/jeu ».
      return fichier.startsWith(racine + path.sep) || fichier === racine
        ? { fichier } : null;
    }
  }
  const reste = urlPath === '/' ? 'index.html' : urlPath.slice(1);
  const fichier = path.resolve(ICI, reste);
  return fichier.startsWith(ICI + path.sep) ? { fichier } : null;
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  // La configuration est servie par le SERVEUR, pas lue comme un fichier
  // statique : le menu doit voir exactement ce que le serveur a monte, y
  // compris quel jeu manque. Deux lectures du meme fichier finissaient par
  // diverger des qu'on passait BORNE_CONF.
  if (urlPath === '/jeux.json') {
    const vue = {
      ...CONF,
      jeux: CONF.jeux.map((j) => ({ ...j, present: montages.has(`/jeux/${j.id}/`) })),
    };
    const corps = Buffer.from(JSON.stringify(vue));
    res.writeHead(200, { 'Content-Type': 'application/json',
      'Content-Length': corps.length, 'Cache-Control': 'no-cache' });
    res.end(corps);
    return;
  }

  const cible = resoudre(urlPath);
  if (!cible) { res.writeHead(403); res.end('Forbidden'); return; }
  if (cible.redirige) {
    res.writeHead(302, { Location: cible.redirige + (req.url.split('?')[1] ? '?' + req.url.split('?')[1] : '') });
    res.end();
    return;
  }

  fs.stat(cible.fichier, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + urlPath);
      return;
    }
    const type = MIME[path.extname(cible.fichier).toLowerCase()] || 'application/octet-stream';

    // Requetes partielles (Range). Indispensable pour l'audio : sans elles, un
    // navigateur ne peut pas sonder un mp3 sans en-tete de duree et rapporte
    // « duration: Infinity », ce qui perturbe la lecture en boucle. Reprise
    // telle quelle du serveur de Microbe Fighter, qui porte la meme regle.
    const match = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range.trim());
    if (match) {
      let start = match[1] === '' ? null : Number(match[1]);
      let end = match[2] === '' ? null : Number(match[2]);
      if (start === null) {
        start = Math.max(0, stat.size - (end ?? 0));
        end = stat.size - 1;
      } else if (end === null || end >= stat.size) {
        end = stat.size - 1;
      }
      if (start > end || start >= stat.size) {
        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
        res.end();
        return;
      }
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(cible.fichier, { start, end }).pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Type': type, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes',
      // Un jour d'exposition on redemarre la borne, pas le navigateur : une
      // page gardee en cache apres une correction est un piege.
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(cible.fichier).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Borne dispo sur http://localhost:${PORT}/`);
  console.log(`Releve des boutons : http://localhost:${PORT}/touches.html`);
});
