# Microbe Fighter — Pixel Fighter

### ▶️ **[JOUER EN LIGNE](https://microbiologames.github.io/Microbe-Fighter/)**

Jeu de combat pixel art façon Street Fighter : **des microbiologistes contre des
bactéries**. HTML/Canvas/JS pur — aucune dépendance, aucun build. Tourne dans un
navigateur, en local ou sur une borne d'arcade Raspberry Pi.

> ⚠️ **Le lien ci-dessus ne marche qu'une fois GitHub Pages activé sur ce
> dépôt** — c'est un réglage à faire une seule fois, à la main :
> **Settings → Pages → Source : `Deploy from a branch` → Branch : `main` / `/ (root)` → Save.**
> Compter une à deux minutes avant la première mise en ligne. Ensuite, chaque
> `git push` sur `main` republie le jeu automatiquement.

Le moteur est repris tel quel de [`sf-pixel-fight`](https://github.com/microbiologames/sf-pixel-fight)
(jeu « famille »), avec ses voix enregistrées ; seuls le roster, les décors et
l'habillage changent.

**Pour ajouter du contenu, tout part du dossier `references/` :**
> - un personnage → [`references/personnages/`](references/README.md)
> - un décor → [`references/decors/`](references/decors/README.md)

---

## Lancer le jeu

**En ligne :** https://microbiologames.github.io/Microbe-Fighter/ (voir l'encadré
plus haut si la page renvoie une 404).

**En local**, le jeu charge ses JSON et ses images via `fetch()`, ce qui ne
marche pas en ouvrant `index.html` directement (`file://`). Il faut un petit
serveur local :

```bash
node server.js          # puis http://localhost:8080
node server.js 8099     # autre port
```

Sous Windows, double-cliquer sur `lancer-le-jeu.bat` fait les deux (serveur +
ouverture du navigateur). Sans Node : `python -m http.server 8080`.

## Contrôles

| | Déplacement | Poing | Pied | Esquive | Narguer |
|---|---|---|---|---|---|
| **Joueur 1** | Z Q S D | F | G | H | T |
| **Joueur 2** | Flèches | K | L | `;` | O |

- **Entrée** : démarrer / valider / rejouer — **Échap** : pause
- **Poing + Pied ensemble** = super attaque, si la jauge d'énergie est pleine
- Manettes et encodeurs USB de borne d'arcade sont lus directement
  (Gamepad API, mapping standard), sans rien configurer.

### Jauge d'énergie

Elle se remplit de +3 %/s pendant le combat (pleine en ~33 s), et **narguer
l'adversaire la remplit de +30 % d'un coup** — c'est le levier principal, ce qui
rend le taunt payant malgré le risque (immobile ~0,7 s).

### Manches

Match en **3 manches gagnantes**, manches de 60 s, 100 PV. Le score s'affiche en
pastilles au-dessus des barres de vie.

---

## Le roster

| Perso | `id` | Voix | Profil |
|---|---|---|---|
| **Doc Gram** — microbiologiste | `gram` | **Nico** (`sfx/nico/`) | Grand, élancé, allonge maximale, un peu lent. Poing = micropipette, super = chalumeau Bunsen. |
| **Doc Pétri** — microbiologiste | `petri` | **Amé** (`sfx/ame/`) — **à enregistrer** | Plus vive, un peu moins d'allonge. Poing = portoir à tubes, super = vapeur d'autoclave. |
| **B. cereus** — *Bacillus cereus* | `cereus` | **Raph** (`sfx/raph/`) | Le plus grand et le plus large, lent, saut bas, encaisse. Le cogneur. Son **spore abdominal** s'embrase sur la super attaque. |
| **L. monocytogenes** — *Listeria monocytogenes* | `listeria` | **Margot** (`sfx/margot/`) | Mince et rapide, saut haut, peu de hurtbox. Griffes et ruée. Le « hit and run ». |

Deux pathogènes alimentaires face à deux microbiologistes : le registre colle au
badge ADRIA des blouses. Les noms affichés suivent la convention scientifique
abrégée (`B. cereus`, `L. monocytogenes`) — le nom complet ne tiendrait pas sous
la barre de vie, qui fait 140 px pour une police de 7 px.

### Les coups

Chaque perso a **deux attaques et une spéciale**, déclarées dans son manifeste.
Les effets d'état sont posés par le champ `effect` d'un coup — le moteur ne
code en dur aucun personnage.

| Perso | Poing (F / K) | Pied (G / L) | Spéciale (Poing + Pied, jauge pleine) |
|---|---|---|---|
| **Doc Gram** | Coup direct — 14 | Jet de biocide — 18, longue portée | **Bec Bunsen** — 18 puis **brûlure 3 s** (7 dégâts/s) |
| **Doc Pétri** | Coup direct — 14 | Jet de biocide — 18, longue portée | **Bec Bunsen** — 18 puis **brûlure 3 s** |
| **B. cereus** | Coup direct — 16 | **Spore** — 8, et **téléporte derrière l'adversaire** | **Jet de céréulide** — 34, le plus gros coup du jeu |
| **L. monocytogenes** | Coup direct — 13 | **Biofilm** — 0 dégât, **invulnérable 1 s** mais ralentie 1,6 s | **Gel** — 16 et **adversaire ralenti 3 s**, teinté bleu |

Les effets disponibles (`effect.type`) : `burn`, `freeze`, `shield`,
`teleportBehind`. `effect.on: "use"` déclenche au lancement du coup plutôt qu'à
la touche — c'est ce qui rend le biofilm et la spore utilisables même à vide.
Un combattant sous biofilm n'encaisse ni le coup ni son effet.

Un combattant ralenti ou gelé se déplace à **un tiers** de sa vitesse
(`SLOW_FACTOR` dans `Config.js`), et sa teinte le signale à l'écran :
orange s'il brûle, bleu s'il est gelé, vert s'il est sous biofilm.

### Croisement

Dès que l'un des deux est en l'air, la séparation des corps est levée : on peut
**sauter par-dessus l'adversaire et atterrir de l'autre côté**. Les deux
continuent de se faire face, `facing` étant recalculé à chaque frame.

L'équilibrage de base reste homogène : les persos se différencient par
`moveSpeed`, `jumpVelocity`, `hurtbox`, `scale` et les portées de hitbox.

Ajouter un 5ᵉ perso = un JSON dans `js/data/characters/`, une entrée dans
`scripts/characters.js`, et un appel `loadCharacter(...)` dans `boot()` de
`js/main.js`. Il apparaît alors tout seul dans le sélecteur et sur l'écran titre.

## Les décors

**Deux décors**, tous deux panoramiques et issus de la même vue du laboratoire
ADRIA : `labo` (jour) et `labo-nuit`. Ils sont listés dans `STAGE_FILES` en haut
de `js/main.js`.

Chacun fait **897×216 px, soit 2,3 écrans et 513 px de défilement**. La caméra
suit le milieu des deux combattants et bute sur les murs du fond — voir
`js/engine/Camera.js`. Tout décor plus large que l'écran défile automatiquement,
sans rien déclarer.

```json
{
  "name": "Laboratoire",
  "background": "assets/stages/labo/background.png",
  "floorRatio": 0.84,
  "stageHeight": 250,
  "palette": { "far": "#2a2c44", "mid": "#3a3d5c", "floor": "#8f97ad", "accent": "#7ee3b8" }
}
```

`floorRatio` et `stageHeight` sont **le cadrage** : où se trouve la ligne de sol
dans l'image source, et à quelle taille mettre la pièce. Ce sont les deux
valeurs qui décident si les combattants marchent sur le carrelage ou sur les
paillasses. Elles sont écrites par `import-wide-stage.js` ; le mode d'emploi
complet est dans [`references/decors/README.md`](references/decors/README.md).

`palette` est un **fond de repli** : tant que `background.png` n'existe pas, le
moteur dessine le décor en aplats à partir de ces quatre couleurs, donc aucun
décor n'est jamais vide.

Pour ajouter un décor : déposer l'image dans `references/decors/`, lancer
`node scripts/import-wide-stage.js <slug> --grid`, régler le cadrage, puis
ajouter le slug à `STAGE_FILES`.

---

## Générer les personnages

Tout part du dossier **[`references/`](references/README.md)**, où tu déposes une
image par personnage (`gram.jpg`, `petri.jpg`, `cereus.jpg`, `listeria.jpg`).

```bash
node scripts/prepare-reference.js         # recadre et redimensionne (1 fois par image)
node scripts/create-character.js gram     # crée le perso sur Pixellab,
                                          # récupère idle/000.png et portrait.png
node scripts/generate-sprites.js gram     # les 10 animations de combat
node scripts/measure-sprites.js --write   # cale groundY et scale sur les vrais sprites
node scripts/check-assets.js              # contrôle de cohérence, sans API
```

`create-character.js` mémorise l'identifiant Pixellab dans
`references/gram.pixellab.json` ; les scripts suivants le relisent tout seuls.

| Script | Rôle |
|---|---|
| `scripts/check-assets.js` | **Sans API.** Manifestes, dossiers, numérotation, sons, décors, musiques. |
| `scripts/measure-sprites.js` | **Sans API.** Décode les PNG et calcule `groundY` et `scale`. `--write` les applique. |
| `scripts/prepare-reference.js` | Recadre et redimensionne une image de référence pour l'API. |
| `scripts/create-character.js` | Crée un perso depuis `references/<perso>.*` + récupère ses poses statiques. |
| `scripts/generate-sprites.js` | Les 10 animations de combat, et aligne `frameCount` sur ce qui est livré. |
| `scripts/generate-stage-background.js` | Les fonds de décor, via l'API. |
| `scripts/import-wide-stage.js` | **Sans API.** Importe un décor panoramique déjà en pixel art et cale sa ligne de sol. |
| `scripts/characters.js` | Les descriptions physiques et d'actions. **Le seul fichier à éditer pour changer l'allure d'un perso.** |

### La clé Pixellab

Les scripts cherchent la clé dans cet ordre :

1. la variable d'environnement **`PIXELLAB_API_KEY`** — c'est le cas dans une
   session Claude Code, où la clé est stockée sur l'environnement cloud ;
2. un fichier **`.env`** à la racine, pour une machine perso :
   ```
   PIXELLAB_API_KEY=ta_cle_ici
   ```
   Il est dans `.gitignore` et ne partira jamais sur GitHub.

### Deux contraintes de l'API, déjà gérées

- **Images de référence : 1024×1024 maximum.** Au-delà, l'API répond 422.
  `prepare-reference.js` s'en occupe.
- **Le CDN est un domaine séparé.** Pixellab publie ses images sur
  `backblaze.pixellab.ai`, distinct de `api.pixellab.ai`. Derrière un pare-feu
  qui n'autorise que l'API, les téléchargements échouent en 403. Les scripts
  lisent donc **le base64 embarqué dans la réponse du job** et ne touchent au
  CDN qu'en dernier recours.

### Conventions de sprites, à respecter absolument

- PNG **carré, RGBA, fond transparent**, personnage **tourné vers la droite**
  (le moteur gère le miroir, pas besoin de version « gauche »). Pixellab produit
  du **128×128** ici ; le moteur accepte n'importe quelle taille du moment que
  `groundY` et `scale` suivent — c'est le rôle de `measure-sprites.js`.
- Frames numérotées **sur 3 chiffres à partir de 000** :
  `assets/sprites/<perso>/<animation>/000.png`, `001.png`, …
- Portrait : `assets/sprites/<perso>/portrait/portrait.png`

| Animation | Frames | Animation | Frames |
|---|---|---|---|
| `idle` | 1 | `punch` | 5 |
| `walk` | 4 | `kick` | 5 |
| `jump` | 4 | `hurt` | 5 |
| `crouch` | 4 | `ko` | 5 |
| `portrait` | 1 | `taunt` | 5 |
| `victory` | 5 | `superattack` | 5 |

`generate-sprites.js` **aligne `frameCount` tout seul** sur ce que Pixellab a
réellement livré, et le signale. `check-assets.js` vérifie derrière.

### `groundY` et `scale`, les deux valeurs qu'on ne peut pas deviner

`groundY` est la **rangée de pixels, dans l'image source**, où les pieds
touchent le sol. Les exports Pixellab ont du vide transparent sous le
personnage : sans cette valeur, il flotte ou s'enfonce dans le sol.

`scale` règle la taille à l'écran : hauteur affichée = hauteur du perso dans
l'image × `scale`. On la veut égale à `hurtbox.heightStand`, sinon la boîte de
collision ne colle pas à ce qu'on voit.

**`node scripts/measure-sprites.js --write` calcule les deux** en décodant
`idle/000.png` (décodeur PNG maison, aucune dépendance). À relancer après chaque
génération. Sans `--write`, il affiche seulement ce qu'il changerait.

Pour modifier le gabarit d'un perso, change `hurtbox.heightStand` dans son
manifeste puis relance `measure-sprites.js --write` : le `scale` suit.

### Deux bugs du dépôt d'origine, à ne pas reproduire

- **Un perso avec un trou** : dans `sf-pixel-fight`, `raph` déclare une super
  attaque mais n'a pas de dossier `superattack/`.
- **Un décor sans fond** : `dojo` y est listé dans `STAGE_FILES` alors que son
  PNG n'existe pas.

`node scripts/check-assets.js` attrape les deux.

---

## ⚠️ Les voix d'Amé manquent

Trois voix sur quatre sont là et branchées : **Nico**, **Raph** et **Margot**,
reprises de `sf-pixel-fight`. La quatrième, celle d'**Amé** (Doc Pétri), **n'a
jamais été enregistrée** — le dossier `assets/audio/sfx/ame/` est **vide
volontairement**.

Le jeu tourne quand même : `js/engine/Audio.js` avale l'erreur quand un fichier
est absent, Doc Pétri est simplement muette.

**Pour la brancher : déposer les 9 WAV dans `assets/audio/sfx/ame/`. Aucun code
à modifier.** Noms exacts et consignes d'enregistrement dans
[`assets/audio/sfx/ame/README.md`](assets/audio/sfx/ame/README.md).

Les 9 sons par personnage : `punch` · `kick` · `hurt` · `ko` · `victory` ·
`jump` · `esquive` · `nargue` · `superattack`.

> Les dossiers de voix sont nommés d'après **la personne** (`nico`, `ame`,
> `raph`, `margot`), pas d'après le personnage : une même voix peut resservir
> pour un perso « déguisé » plus tard. Le `narguer.wav` de Margot, seule
> incohérence du dépôt d'origine, a été renommé `nargue.wav` ici.

## La musique

**Une seule piste, en boucle, du lancement du jeu jusqu'à la fin** — pas de
phases ni de fondu. Aujourd'hui `Flamme_pure.mp3` (192 kbps, 2 min 32, 3,6 Mo),
dans [`assets/audio/music/`](assets/audio/music/README.md).

Pour en changer : déposer le fichier et ajuster **une ligne** en haut de
`js/main.js`. Le mp3 et l'ogg sont lus nativement, aucune conversion nécessaire.

`js/engine/Music.js` compose avec la **politique de lecture automatique** des
navigateurs, qui interdit de jouer un son avant une interaction : il tente au
chargement, et se réarme sur le premier appui de touche si c'est refusé. Si le
fichier manque, le jeu tourne en silence sans broncher.

---|---|
| `title-screen.wav` | Écran titre et écrans de sélection |
| `ambient-theme.wav` | Pendant le combat |
| `combat-low-hp.wav` | Dès qu'un combattant passe sous 50 PV, en fondu |
| `victory.wav` | Écran de fin de match |

Seul `victory.wav` est dans le dépôt. Les trois autres pesaient **27 Mo chacune**
dans le jeu d'origine (WAV non compressé) : 82 Mo définitifs dans l'historique
git, retéléchargés à chaque visite. Elles ont donc été écartées, mais **le motif
Strudel qui les a produites est conservé** à côté, dans les `.js` du même
dossier.

`js/engine/Music.js` est silencieux tant qu'un fichier manque : le jeu tourne
normalement. Préfère de l'**ogg ou du mp3** — dix fois plus léger que le WAV à
qualité équivalente ; il suffit alors d'ajuster l'extension dans les quatre
constantes en haut de `js/main.js`. Tout est détaillé dans le
[README du dossier](assets/audio/music/README.md).

---

## Arborescence

```
microbe-fighter/
  index.html                  écran de jeu (canvas + overlays)
  css/style.css
  server.js                   serveur statique local, sans dépendance
  lancer-le-jeu.bat           lanceur Windows
  references/
    personnages/              ← TES IMAGES DE COMBATTANTS
    decors/                   ← TES IMAGES DE DÉCORS
    prepared/                 versions recadrées pour l'API (générées)
  js/
    main.js                   boucle de jeu et écrans
    engine/                   Config, Input, SpriteLoader, Fighter, Stage,
                              HUD, Effects, Audio, Music
    data/
      characters/{gram,petri,cereus,listeria}.json
      stages/<slug>.json
  assets/
    sprites/<perso>/<animation>/     ← les exports Pixellab arrivent ici
    stages/<slug>/background.png
    audio/sfx/{nico,raph,margot}/    ← voix enregistrées, en place
    audio/sfx/ame/                   ← VIDE, voir plus haut
    audio/sfx/jingle/
    audio/music/
    fonts/PressStart2P-Regular.ttf
  scripts/                    génération Pixellab + contrôle de cohérence
```

## Faire évoluer le jeu

- **Ajouter un coup** : une entrée de plus dans `moves` du JSON du perso
  (dégâts, knockback, `activeFrames`, hitbox) + l'animation correspondante.
- **Régler une hitbox** : `hitbox.offsetX/offsetY/width/height` sont en pixels
  du canvas 384×216 — à ajuster à l'œil en jouant.
- **Ajouter un décor** : un JSON dans `js/data/stages/` + son slug dans
  `STAGE_FILES`. Ne jamais lister un décor sans `background` **ni** `palette`.
- **Toutes les constantes de gameplay** (gravité, vitesse, dégâts, durée des
  manches, énergie) sont dans `js/engine/Config.js`.

---

## Déploiement sur borne d'arcade Raspberry Pi

1. Copier le dossier sur le Raspberry Pi (clé USB, `scp` ou `git clone`).
2. Installer Node et Chromium :
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt install -y nodejs chromium-browser
   ```
3. Lancer le serveur au démarrage —
   `/etc/systemd/system/microbe-fighter.service` :
   ```ini
   [Unit]
   Description=Microbe Fighter server
   After=network.target

   [Service]
   ExecStart=/usr/bin/node /home/pi/microbe-fighter/server.js 8080
   Restart=always
   User=pi

   [Install]
   WantedBy=multi-user.target
   ```
   ```bash
   sudo systemctl enable --now microbe-fighter
   ```
4. Chromium en mode kiosque au démarrage du bureau (dans
   `~/.config/lxsession/LXDE-pi/autostart` ou équivalent) :
   ```
   @xset s off
   @xset -dpms
   @xset s noblank
   @chromium-browser --kiosk --incognito --noerrdialogs --disable-infobars http://localhost:8080
   ```
5. Brancher l'encodeur USB de la borne : il est vu comme un clavier ou une
   manette, les deux sont gérés par `Input.js`. Si l'encodeur envoie d'autres
   touches que ZQSD / Flèches / F G / K L, reconfigurer l'encodeur (recommandé)
   ou adapter `KEY_MAPS` dans `js/engine/Input.js`.

Le canvas est en 384×216 interne et s'étire en 16:9 via CSS, avec
`image-rendering: pixelated` — les pixels restent nets sur un grand écran.
