# Microbe Fighter — Pixel Fighter

Jeu de combat pixel art façon Street Fighter : **des microbiologistes contre des
bactéries**. HTML/Canvas/JS pur — aucune dépendance, aucun build. Tourne dans un
navigateur, en local ou sur une borne d'arcade Raspberry Pi.

Le moteur est repris tel quel de [`sf-pixel-fight`](https://github.com/microbiologames/sf-pixel-fight)
(jeu « famille »), avec ses voix enregistrées ; seuls le roster, les décors et
l'habillage changent.

> **Pour ajouter un personnage : dépose son image dans [`references/`](references/README.md)
> et lance deux commandes.** Tout est expliqué là-bas.

---

## Lancer le jeu

Le jeu charge ses JSON et ses images via `fetch()`, ce qui ne marche pas en
ouvrant `index.html` directement (`file://`). Il faut un petit serveur local :

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
| **Doc Gram** — microbiologiste | `gram` | **Nico** (`sfx/nico/`) | Grand, allonge maximale, un peu lent. Poing = micropipette, super = chalumeau Bunsen. |
| **Doc Pétri** — microbiologiste | `petri` | **Amé** (`sfx/ame/`) — **à enregistrer** | Plus vive, moins d'allonge. Poing = portoir à tubes, super = vapeur d'autoclave. |
| **Staphy** — staphylocoque doré | `staphy` | **Raph** (`sfx/raph/`) | Large, lent, saut bas, frappe court mais encaisse. Le cogneur. |
| **Coli** — bacille flagellé | `coli` | **Margot** (`sfx/margot/`) | Petit, très rapide, saut haut, peu de hurtbox. Le « hit and run ». |

L'équilibrage de base est le même pour tous (poing 14 / pied 18 / super 26) :
les persos se différencient par `moveSpeed`, `jumpVelocity`, `hurtbox`, `scale`
et les portées de hitbox — pas en cassant ces valeurs.

Ajouter un 5ᵉ perso = un JSON dans `js/data/characters/`, une entrée dans
`scripts/characters.js`, et un appel `loadCharacter(...)` dans `boot()` de
`js/main.js`. Il apparaît alors tout seul dans le sélecteur et sur l'écran titre.

## Les décors

Huit décors en rotation, listés dans `STAGE_FILES` de `js/main.js` :
`paillasse` · `boite-de-petri` · `hotte` · `salle-de-culture` · `congelateur` ·
`autoclave` · `microscope` · `intestin`

```json
{
  "name": "Paillasse",
  "background": "assets/stages/paillasse/background.png",
  "palette": { "far": "#22313f", "mid": "#35506a", "floor": "#8d9daa", "accent": "#d3e6f1" }
}
```

`palette` est un **fond de repli** : tant que `background.png` n'existe pas, le
moteur dessine le décor en aplats à partir de ces quatre couleurs, donc chaque
lieu reste reconnaissable et aucun décor n'est « cassé ». Dès que le PNG est
déposé, il prend le dessus et la palette n'est plus lue.

---

## Générer les personnages

Tout part du dossier **[`references/`](references/README.md)**, où tu déposes une
image par personnage (`gram.png`, `petri.png`, `staphy.png`, `coli.png`).

```bash
node scripts/create-character.js gram     # crée le perso sur Pixellab,
                                          # récupère idle/000.png et portrait.png
node scripts/generate-sprites.js gram     # les 10 animations de combat
node scripts/check-assets.js              # contrôle de cohérence, sans API
```

`create-character.js` mémorise l'identifiant Pixellab dans
`references/gram.character-id` ; `generate-sprites.js` le relit tout seul.

### La clé Pixellab

Les scripts cherchent la clé dans cet ordre :

1. la variable d'environnement **`PIXELLAB_API_KEY`** — c'est le cas dans une
   session Claude Code, où la clé est stockée sur l'environnement cloud ;
2. un fichier **`.env`** à la racine, pour une machine perso :
   ```
   PIXELLAB_API_KEY=ta_cle_ici
   ```
   Il est dans `.gitignore` et ne partira jamais sur GitHub.

| Script | Rôle |
|---|---|
| `scripts/check-assets.js` | **Sans API.** Manifestes, dossiers, numérotation, sons, décors, musiques. |
| `scripts/create-character.js` | Crée un perso depuis `references/<perso>.png` + récupère ses poses statiques. |
| `scripts/generate-sprites.js` | Les 10 animations de combat. |
| `scripts/generate-stage-background.js` | Les fonds de décor (photo de `references/` si présente, sinon description). |
| `scripts/characters.js` | Les descriptions physiques et d'actions. **Le seul fichier à éditer pour changer l'allure d'un perso.** |

### Conventions de sprites, à respecter absolument

- PNG **256×256**, RGBA, **fond transparent**, personnage **tourné vers la
  droite** (le moteur gère le miroir, pas besoin de version « gauche »)
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

Si Pixellab exporte un nombre de frames différent, corrige `frameCount` dans le
JSON du perso — aucun code à toucher. `check-assets.js` le signale.

### `groundY`, le piège classique

`groundY` est la **rangée de pixels, dans l'image source 256×256**, où les pieds
touchent le sol. Les exports Pixellab ont du vide transparent sous le
personnage : sans cette valeur, le perso flotte ou s'enfonce. Pour la trouver,
ouvre `idle/000.png` dans un éditeur d'image et lis l'ordonnée de la ligne sous
les pieds. Une seule valeur par perso suffit.

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

## ⚠️ Trois musiques sur quatre ne sont pas versionnées

`title-screen`, `ambient-theme` et `combat-low-hp` pèsent **27 Mo chacune** en
WAV (2 min 35). Elles ont été volontairement laissées hors du dépôt : 82 Mo dans
l'historique git d'un dépôt neuf, c'est irréversible, et ça se télécharge à
chaque visite.

Le **motif Strudel qui les produit** est versionné à côté, dans
`assets/audio/music/*.js`. Seule `victory.wav` (608 Ko, 3,5 s) est incluse.

`js/engine/Music.js` est silencieux tant qu'un fichier est absent : le jeu
tourne normalement. Pour les réactiver, dépose les `.wav` dans
`assets/audio/music/` — ou mieux, des `.ogg`, en ajustant les quatre constantes
en haut de `js/main.js`.

---

## Arborescence

```
microbe-fighter/
  index.html                  écran de jeu (canvas + overlays)
  css/style.css
  server.js                   serveur statique local, sans dépendance
  lancer-le-jeu.bat           lanceur Windows
  references/                 ← TES IMAGES À TRANSFORMER EN PERSOS
  js/
    main.js                   boucle de jeu et écrans
    engine/                   Config, Input, SpriteLoader, Fighter, Stage,
                              HUD, Effects, Audio, Music
    data/
      characters/{gram,petri,staphy,coli}.json
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
