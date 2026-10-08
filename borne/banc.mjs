/* ---------------------------------------------------------------------------
   Banc du lanceur. Il conduit le VRAI serveur (serveur.js, lance en
   processus fils) dans un vrai navigateur : c'est la page qu'on livre a la
   borne qui est mesuree, pas une reimplementation du serveur dans le banc.

   Les manettes, elles, sont hors de portee de Playwright. Ce qui est mesure
   ici est donc le chemin CLAVIER du lanceur, qui partage tout le reste avec
   le chemin manette (meme fronts, meme combo, meme boucle) ; ce qui reste
   propre a l'encodeur se releve sur la borne avec touches.html.

     npm install && npm run banc
--------------------------------------------------------------------------- */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request } from 'node:http';

const PORT = 8096;
const PORT_MANQUE = 8095;
const ICI = new URL('.', import.meta.url).pathname.replace(/\/$/, '');

const verdicts = [];
function dire(ok, nom, detail = '') {
  verdicts.push(ok);
  console.log(`  [${ok ? ' OK  ' : 'ECHEC'}] ${String(verdicts.length).padStart(2)}. ${nom}${detail ? ' — ' + detail : ''}`);
}

/** Lance serveur.js et rend ce qu'il a ecrit au demarrage. */
function serveur(port, conf) {
  const fils = spawn(process.execPath, ['serveur.js', String(port)], {
    cwd: ICI, env: { ...process.env, ...(conf ? { BORNE_CONF: conf } : {}) },
  });
  let journal = '';
  fils.stdout.on('data', (d) => { journal += d; });
  fils.stderr.on('data', (d) => { journal += d; });
  return {
    fils,
    journal: () => journal,
    /* Un serveur qui ne demarre PAS doit arreter le banc, pas le laisser
       mesurer autre chose. Un fils reste d'un banc precedent gardait le
       port : le banc parlait alors a un serveur d'une version anterieure et
       restait vert pendant que le code modifie n'avait jamais tourne. C'est
       la panne que ce depot connait deja sous un autre nom — verifier la
       page qu'on LIVRE, pas celle qu'on garde. */
    pret: new Promise((r, rejette) => {
      const t = setInterval(() => { if (journal.includes('Borne dispo')) { clearInterval(t); r(); } }, 60);
      setTimeout(() => {
        clearInterval(t);
        if (journal.includes('Borne dispo')) r();
        else rejette(new Error(`le serveur n'a pas demarre sur le port ${port} :\n${journal}`));
      }, 5000);
    }),
  };
}

/** Une requete BRUTE : le chemin part tel quel, sans normalisation. */
function brut(port, chemin) {
  return new Promise((r) => {
    const req = request({ host: 'localhost', port, path: chemin, method: 'GET' },
      (res) => { res.resume(); r(res.statusCode); });
    req.on('error', () => r(0));
    req.end();
  });
}

const srv = serveur(PORT);
await srv.pret;

const CANDIDATES = [
  process.env.CHROMIUM_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium/chrome-linux/chrome',
].filter(Boolean);
const exe = CANDIDATES.find((p) => existsSync(p));
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

console.log('banc du lanceur — serveur reel, chemin clavier');
console.log(`cible: http://localhost:${PORT}/`);

const monte = srv.journal();
dire(/\/jeux\/microbe-fighter\/ -> \//.test(monte) && /\/jeux\/cell-dungeon\/ -> \//.test(monte),
  'le serveur monte les deux jeux',
  monte.split('\n').filter((l) => l.includes('-> ')).map((l) => l.trim().split(' -> ')[0]).join(' '));

const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const erreurs = [];
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
page.on('pageerror', (e) => erreurs.push(e.message));
/* Une ressource qui n'arrive pas ne fait pas toujours d'erreur de console et
   ne change pas forcement l'allure de la page : on surveille donc aussi les
   requetes elles-memes. Les fetch sont exclus : Chromium rapporte
   ERR_ABORTED pour un fetch HEAD dont on ne lit jamais le corps, alors que
   la reponse est bonne — mesure : ok=true, status 200, et curl -I propre.
   Ce sont les scripts, images et feuilles de style qui comptent ici. */
const requetesRatees = [];
page.on('requestfailed', (r) => {
  if (r.resourceType() !== 'fetch') requetesRatees.push(`${r.url()} (${r.failure()?.errorText})`);
});
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

const etat = () => page.evaluate(() => ({
  jeu: window.__borne.jeu, choix: window.__borne.choix, retour: window.__borne.retour,
  iframes: window.__borne.iframes, presents: window.__borne.presents,
  menuVisible: !document.getElementById('menu').classList.contains('parti'),
  jaugeOn: document.getElementById('jauge').classList.contains('on'),
}));

/** Amene la designation sur un jeu : le menu boucle, compter les appuis ne
    suffit pas. */
async function viser(id) {
  for (let i = 0; i < 6; i++) {
    if ((await etat()).choix === id) return true;
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(120);
  }
  return false;
}

{
  dire(erreurs.length === 0 && requetesRatees.length === 0, 'le menu charge sans erreur ni requete ratee',
    [...erreurs, ...requetesRatees.map((u) => 'requete ratee: ' + u)].join(' | ') || 'aucune');
  const e = await etat();
  dire(e.presents.length === 2 && e.choix !== null, 'les deux jeux sont disponibles et un est designe',
    `${e.presents.join(', ')} — designe: ${e.choix}`);

  const avant = e.choix;
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(120);
  const apres = (await etat()).choix;
  dire(apres !== avant, 'le cap deplace la designation', `${avant} -> ${apres}`);
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(120);
}

/* --- Microbe Fighter : lancer, jouer, revenir ---------------------------- */
{
  await viser('microbe-fighter');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  const e = await etat();
  dire(e.jeu === 'microbe-fighter' && e.iframes === 1 && !e.menuVisible,
    'valider lance le jeu dans une iframe', `jeu=${e.jeu} iframes=${e.iframes}`);

  const cadre = page.frames().find((f) => f.url().includes('microbe-fighter'));
  const vivant = cadre ? await cadre.evaluate(() => {
    const c = document.getElementById('game-canvas');
    return { canvas: !!c, largeur: c?.width || 0, titre: !document.getElementById('overlay-title').classList.contains('hidden') };
  }) : null;
  dire(!!vivant && vivant.canvas && vivant.largeur === 384,
    'le jeu tourne dans l\'iframe', vivant ? `canvas ${vivant.largeur} px, ecran titre ${vivant.titre}` : 'iframe absente');

  const sansPointeur = await cadre.evaluate(() =>
    getComputedStyle(document.body).cursor);
  dire(sansPointeur === 'none', 'le pointeur est masque jusque dans le jeu',
    `cursor=${sansPointeur}`);

  /* Le lanceur ne doit pas voler les touches au jeu : Entree doit passer
     l'ecran titre de Microbe Fighter, comme sans lanceur. */
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  const passe = await cadre.evaluate(() =>
    !document.getElementById('overlay-mode').classList.contains('hidden'));
  dire(passe, 'le lanceur ne vole pas les touches au jeu', 'ecran titre franchi dans l\'iframe');

  /* Maintien COURT : la jauge se remplit, mais on ne quitte pas. */
  await page.keyboard.down('Enter');
  await page.keyboard.down('NumpadEnter');
  await page.waitForTimeout(700);
  const court = await etat();
  await page.keyboard.up('Enter');
  await page.keyboard.up('NumpadEnter');
  await page.waitForTimeout(200);
  const relache = await etat();
  dire(court.retour > 0.2 && court.retour < 1 && court.jeu === 'microbe-fighter'
    && court.jaugeOn && relache.retour === 0,
    'un maintien court remplit la jauge sans quitter',
    `jauge ${(court.retour * 100).toFixed(0)} % puis ${(relache.retour * 100).toFixed(0)} %`);

  /* Maintien COMPLET : retour au menu, et l'iframe est detruite. */
  await page.keyboard.down('Enter');
  await page.keyboard.down('NumpadEnter');
  await page.waitForTimeout(1900);
  await page.keyboard.up('Enter');
  await page.keyboard.up('NumpadEnter');
  await page.waitForTimeout(300);
  const retour = await etat();
  dire(retour.jeu === null && retour.iframes === 0 && retour.menuVisible && !retour.jaugeOn,
    'le maintien complet revient au menu et detruit l\'iframe',
    `iframes=${retour.iframes} menu=${retour.menuVisible}`);
}

/* --- Cell Dungeon : le second jeu, et son propre clavier ----------------- */
{
  await viser('cell-dungeon');
  const vise = (await etat()).choix;
  await page.keyboard.press('Space');
  await page.waitForTimeout(2500);
  const e = await etat();
  dire(vise === 'cell-dungeon' && e.jeu === 'cell-dungeon' && e.iframes === 1,
    'le second jeu se lance aussi', `designe=${vise} lance=${e.jeu}`);

  const cadre = page.frames().find((f) => f.url().includes('cell-dungeon'));
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);
  const dedans = cadre ? await cadre.evaluate(() => ({
    scene: window.__scene, overlay: window.__overlay.current,
  })) : null;
  dire(!!dedans && dedans.scene === 'lobby' && dedans.overlay === null,
    'Cell Dungeon franchit son ecran titre dans l\'iframe',
    dedans ? `scene=${dedans.scene} overlay=${dedans.overlay}` : 'iframe absente');

  await page.keyboard.down('Enter');
  await page.keyboard.down('NumpadEnter');
  await page.waitForTimeout(1900);
  await page.keyboard.up('Enter');
  await page.keyboard.up('NumpadEnter');
  await page.waitForTimeout(300);
  const r = await etat();
  dire(r.jeu === null && r.iframes === 0, 'et on en revient par le meme geste',
    `iframes=${r.iframes}`);
}

/* --- Retour sur inactivite ----------------------------------------------- */
{
  await page.goto(`http://localhost:${PORT}/?inactif=2`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  const pendant = await etat();
  await page.waitForTimeout(2600);
  const apres = await etat();
  dire(pendant.jeu !== null && apres.jeu === null && apres.iframes === 0,
    'une borne laissee seule revient au menu',
    `lance=${pendant.jeu}, 2 s plus tard=${apres.jeu}`);
}

/* --- Un jeu manquant se voit, et la racine d'un jeu ne se quitte pas ----- */
{
  const conf = JSON.parse(readFileSync(join(ICI, 'jeux.json'), 'utf8'));
  conf.jeux = conf.jeux.map((j) => (j.id === 'cell-dungeon'
    ? { ...j, racines: ['/chemin/qui/n/existe/pas'] } : j));
  const chemin = join(tmpdir(), 'borne-conf-banc.json');
  writeFileSync(chemin, JSON.stringify(conf));
  const srv2 = serveur(PORT_MANQUE, chemin);
  await srv2.pret;

  const p2 = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await p2.goto(`http://localhost:${PORT_MANQUE}/`, { waitUntil: 'networkidle' });
  await p2.waitForTimeout(500);
  const vue = await p2.evaluate(() => ({
    presents: window.__borne.presents,
    barrees: document.querySelectorAll('.tuile.absent').length,
  }));
  dire(vue.presents.length === 1 && vue.barrees === 1,
    'un jeu absent du disque est barre dans le menu',
    `presents=${vue.presents.join(',') || 'aucun'} barrees=${vue.barrees}`);
  await p2.close();
  srv2.fils.kill();
}
{
  /* Chemin NON normalise, envoye tel quel : un navigateur ne sait pas le
     produire, un curl si. Le serveur sert deux dossiers hors de son propre
     arbre, c'est donc la sortie de racine qu'il faut tenir.

     La cible doit EXISTER, sinon le 404 du fichier absent se fait passer
     pour un refus : premiere version de ce verdict, le chemin visait un
     dossier imaginaire et le verdict restait vert meme sans garde-fou.
     /etc/hostname existe sur toute machine, et path.resolve s'arrete a la
     racine, donc six niveaux suffisent d'ou qu'on parte.
     Le code attendu est 403 et RIEN D'AUTRE, pour la meme raison. */
  const evasion = '/jeux/cell-dungeon/' + '%2e%2e%2f'.repeat(6) + 'etc/hostname';
  const code = await brut(PORT, evasion);
  dire(code === 403, 'on ne sort pas de la racine d\'un jeu', `HTTP ${code}`);
}

await browser.close();
srv.fils.kill();

const rates = verdicts.filter((v) => !v).length;
console.log(`\n${verdicts.length - rates}/${verdicts.length} verdicts tenus`);
if (rates) { console.log(`${rates} ECHEC(S)`); process.exit(1); }
