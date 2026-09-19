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
| **B. cereus** — *Bacillus cereus* | `cereus` | Créature | Le plus grand et le plus large, lent, saut bas, encaisse. Le cogneur. Son **spore abdominal** s'embrase sur la super attaque. |
| **L. monocytogenes** — *Listeria monocytogenes* | `listeria` | Créature | Mince et rapide, saut haut, peu de hurtbox. Griffes et ruée. Le « hit and run ». |
| **S. aureus** — *Staphylococcus aureus* | `staph` | Grappe de petites voix | Une grappe de coques dorées, chacune avec sa tête. Vitesse moyenne. **Quasi insensible aux biocides, mais fragile face à la chaleur.** |
| **Salmonella** — *Salmonella enterica* | `salmonella` | Femme grave | Bacille rose à six flagelles métalliques façon Docteur Octopus. Rapide et mobile, mais la chaleur la tue. |
| **C. botulinum** — *Clostridium botulinum* | `botulinum` | Créature énorme et lente | Difforme, déformé par sa spore. Le plus lent du jeu. **Ses spores encaissent la chaleur**, sa neurotoxine paralyse. |
| **P. fluorescens** — *Pseudomonas fluorescens* | `pseudomonas` | Éthérée, liquide | Fine et luminescente. Rapide, fragile, et **totalement insensible au gel** : elle pousse à 4 °C. |
| **S. putrefaciens** — *Shewanella putrefaciens* | `shewanella` | Bête à quatre pattes | Humanoïde décharné à la peau rouillée, mains et pieds noircis, longue queue. Empoisonne au gaz. |
| **A. flavus** — *Aspergillus flavus* | `aspergillus` | Bruissement sec de spores | **Une moisissure, pas une bactérie.** Lent et résistant. Son aflatoxine marque l'adversaire à vie. |

### Les microbiologistes historiques

Neuf scientifiques qui ont réellement existé, et dont le **talent propre fait le
personnage**. Aucun n'est un reskin d'un autre.

| Perso | `id` | Ce qu'il/elle a fait | Ce que ça donne en jeu |
|---|---|---|---|
| **Kary Mullis** | `mullis` | Inventeur de la **PCR** | Le plus rapide du roster. Dégâts faibles, cadence élevée. |
| **Rosalind Franklin** | `franklin` | Découvreuse de la **structure de l'ADN** | La précision : lente, longue portée, les plus gros dégâts par coup. |
| **József Baranyi** | `baranyi` | Pionnier de la **microbiologie prévisionnelle** | Le contrôle : ses attaques **ralentissent la croissance** de l'adversaire. |
| **Emmanuelle Charpentier** | `charpentier` | Découvreuse de **CRISPR-Cas9** | Ses ciseaux **traversent les défenses** — la seule à toucher Listeria sous biofilm. |
| **Claire Fraser** | `fraser` | Pionnière du **séquençage de génome complet** | **Aspire l'ADN** : la seule du jeu à se soigner en frappant. |
| **Alice Evans** | `evans` | Pionnière de la **pasteurisation** | Chaleur rapide — mais **sans effet sur les spores**. |
| **Nicolas Appert** | `appert` | Inventeur de la **conserve** | Lent et lourd, mais son **autoclave ignore toute thermorésistance**. |
| **Louis Pasteur** | `pasteur` | Pionnier de la **microbiologie culturale** | Bec bunsen, et un **piège en gélose** qui cloue l'adversaire 1,8 s. |
| **Élie Metchnikoff** | `metchnikoff` | Pionnier des **ferments lactiques et probiotiques** | Le seul à **invoquer des alliés** : ses lactobacilles combattent tout seuls. |

#### Deux paires, et pourquoi elles ne sont pas des doublons

La liste de départ donnait les **mêmes noms de coups** à deux paires. Les noms
sont conservés ; ce sont les statistiques et un détail de la spéciale qui les
séparent — et dans les deux cas la différence est réelle.

**Mullis et Franklin** lancent tous deux des amplicons. Mullis a *inventé la
réaction* : chez lui c'est le débit, il est le plus rapide du jeu et frappe
faible. Franklin a *résolu la structure* par diffraction : chez elle c'est la
justesse, elle est lente, porte plus loin et frappe beaucoup plus fort.

**Evans et Appert** chauffent tous deux. Mais **pasteuriser n'est pas
stériliser** : la pasteurisation détruit les formes végétatives et laisse les
spores intactes, l'appertisation les détruit aussi. En jeu, la spéciale d'Evans
subit normalement les résistances — **C. botulinum, à 0,25 en chaleur, se moque
d'elle** — tandis que celle d'Appert porte `ignoreResistance` et passe outre.
Appert est le seul personnage du roster capable de tuer un sporulé à la chaleur,
et c'est exactement ce que fait un barème 121 °C / 3 min.

**Dix-sept personnages : neuf microbiologistes contre huit micro-organismes.** Cinq
pathogènes alimentaires (*B. cereus*, *L. monocytogenes*, *S. aureus*,
*Salmonella*, *C. botulinum*), deux flores d'altération (*P. fluorescens*,
*S. putrefaciens*) et une moisissure toxinogène (*A. flavus*). Le registre colle
au badge ADRIA des blouses. Les noms affichés suivent la convention scientifique
abrégée (`B. cereus`, `L. monocytogenes`, `S. aureus`) — le nom complet ne tiendrait
pas sous
la barre de vie, qui fait 140 px pour une police de 7 px.

### Les coups

Chaque perso a **deux attaques et une spéciale**, déclarées dans son manifeste.
Les effets d'état sont posés par le champ `effect` d'un coup — le moteur ne
code en dur aucun personnage.

| Perso | Poing (F / K) | Pied (G / L) | Spéciale (Poing + Pied, jauge pleine) |
|---|---|---|---|
| **B. cereus** | Coup direct — 16 | **Spore** — 8, et **téléporte derrière l'adversaire** | **Jet de céréulide** — 34, le plus gros coup du jeu |
| **L. monocytogenes** | Coup direct — 13 | **Biofilm** — 0 dégât, **invulnérable 1 s** mais ralentie 1,6 s | **Gel** — 16 et **adversaire ralenti 3 s**, teinté bleu |
| **S. aureus** | Coup direct — 15 | **Coagulase** — 6, et **fige l'adversaire 1 s** dans un cube de plasma | **Toxine staphylococcique** — 34, à égalité avec la céréulide |
| **Salmonella** | Coup de flagelle — 15 | **Ruée flagellaire** — 12, **se propulse de 40 px vers l'avant** | **Invasion** — 32, injection par l'aiguille du T3SS |
| **C. botulinum** | Coup direct — 12 | **Bombage** — 10, mais le **plus gros recul du jeu** | **Neurotoxine** — 14 et **paralyse 2,5 s** |
| **P. fluorescens** | Coup direct — 13 | **Jet de pyoverdine** — 16, longue portée | **Protéases thermostables** — 30 |
| **S. putrefaciens** | Coup de patte — 14 | **Jet d'H₂S** — 10 et **empoisonne 3,5 s** | **Putréfaction** — 26 et **empoisonne 5 s** |
| **A. flavus** | Coup de mycélium — 14 | **Nuage de conidies** — 8, la plus large zone du jeu | **Aflatoxine B1** — 20 et **marque à vie** (voir plus bas) |
| **Kary Mullis** | Coup de micropipette — 11 | **Jet d'amplicon** — 13, sort très vite | **Tornade d'amplicons** — 26 |
| **Rosalind Franklin** | Coup droit — 15 | **Jet d'amplicon** — 19, la plus longue portée | **Tornade d'amplicons** — 33, le plus gros coup unique du jeu |
| **József Baranyi** | Coup de règle — 13 | **Attaque mathématique** — 12 et **ralentit 2 s** | **Tornade de mathématiques** — 25 et **ralentit 4 s** |
| **Emmanuelle Charpentier** | Coup de ciseaux — 13 | **Attaque CRISPR** — 16, **traverse les défenses** | **Tornade de ciseaux** — 29, **traverse les défenses** |
| **Claire Fraser** | Coup droit — 12 | **Aspiration de l'ADN** — 12, **rend la moitié en vie** | **Aspiration intense** — 24, **rend 60 % en vie** |
| **Alice Evans** | Coup de bidon — 13 | **Choc thermique** — 17 + brûlure 2 s | **Autoclave** — 27 + brûlure 3 s |
| **Nicolas Appert** | Coup de bocal — 15 | **Choc thermique** — 16 + brûlure 2,5 s | **Autoclave 121 °C** — 30, **ignore toute thermorésistance** |
| **Louis Pasteur** | Coup de ballon — 14 | **Bec bunsen** — 17 + brûlure 3 s | **Piège agar** — 10 et **fige 1,8 s** dans un cube de gélose |
| **Élie Metchnikoff** | Coup de bol — 12 | **Lactobacille** — lâche **un allié** autonome | **Équipe de lactobacilles** — en lâche **quatre** |

Les effets disponibles (`effect.type`) : `burn`, `poison`, `freeze`, `shield`,
`teleportBehind`, `dash`, `trap`, `paralyse`, `mark`, `drain`, `summon`.
Deux **drapeaux** se posent en plus sur le coup lui-même, pas dans son `effect` :
`pierce` (traverse biofilm et esquive) et `ignoreResistance` (ignore les
résistances de la cible). `effect.on: "use"` déclenche au lancement du coup
plutôt qu'à la touche — c'est ce qui rend le biofilm et la spore utilisables même
à vide. Un combattant sous biofilm n'encaisse ni le coup ni son effet.

**Trois effets retirent la main au joueur, à trois degrés différents** — c'est
la distinction la plus importante du jeu :

| Effet | Ce qu'il reste au joueur |
|---|---|
| `freeze` (Gel) | Tout, mais à **un tiers de la vitesse** |
| `paralyse` (Neurotoxine) | **La marche et l'accroupissement seulement** : plus de coups, plus de saut, plus d'esquive |
| `trap` (Coagulase) | **Rien du tout**, plus aucune touche n'est lue |

`paralyse` traduit la paralysie *flasque* de la toxine botulique : elle coupe la
commande motrice sans figer le corps, au contraire du tétanos qui raidit. Le
personnage garde donc ses jambes, et c'est ce qui la rend jouable — 2,5 s de
`trap` seraient insupportables.

`trap` dessine un cube jaunâtre translucide autour de la cible
(`COAGULATION_CUBE` dans `Config.js`).

`drain` est le seul moyen du jeu de **regagner de la vie**. C. Fraser récupère
une part des dégâts qu'elle inflige — calculée sur les dégâts **réellement
encaissés**, donc nulle sur un coup qui ne passe pas et réduite quand la cible
résiste. Sans cette précision, elle se soignerait à plein tarif en tapant dans
un biofilm.

`summon` lâche des alliés autonomes qui traversent le terrain et mordent
l'adversaire tout seuls — les lactobacilles d'É. Metchnikoff, voir
[`js/engine/Allies.js`](js/engine/Allies.js). C'est le seul endroit du moteur où
quelque chose agit sans qu'un joueur appuie sur une touche. Leur morsure passe
par `takeHit` comme n'importe quel coup, donc les résistances et les marques
s'y appliquent.

`pierce` et `ignoreResistance` sont les deux manières de **passer outre une
défense**, et elles ne visent pas la même :

| Drapeau | Ce qu'il ignore | Qui l'a |
|---|---|---|
| `pierce` | Le **biofilm** et l'**esquive** — ce qui rend intouchable | E. Charpentier (CRISPR) |
| `ignoreResistance` | Les **résistances** de la cible à un type de dégâts | N. Appert (autoclave) |

`mark`, l'aflatoxine, est le seul effet **définitif** : chaque marque majore de
10 % tous les dégâts que la cible encaissera jusqu'à la fin du combat, cumulable
cinq fois. Rien ne l'enlève, pas même le biofilm une fois posée. Le danger réel
de l'aflatoxine B1 n'est pas l'intoxication aiguë mais l'**exposition chronique
cumulative** — c'est le cancérogène hépatique naturel le plus puissant connu.

Un combattant ralenti ou gelé se déplace à **un tiers** de sa vitesse
(`SLOW_FACTOR` dans `Config.js`), et sa teinte le signale à l'écran :
orange s'il brûle, bleu s'il est gelé, jaune s'il est pris dans la coagulase,
vert s'il est sous biofilm.

### Types de dégâts et résistances

Chaque coup porte un `damageType` — `physique`, `biocide`, `chaleur` ou
`toxine` — et un personnage peut déclarer des `resistances` dans son manifeste :

```json
"resistances": { "biocide": 0.15, "chaleur": 1.6 }
```

Le nombre **multiplie** les dégâts reçus de ce type. `1` (la valeur par défaut,
et le cas des quatre premiers personnages) ne change rien ; `0.15` veut dire
qu'il n'encaisse que 15 % du coup ; `1.6`, qu'il en prend 60 % de plus. La
brûlure du bec Bunsen est mise à l'échelle de la même façon, tick par tick.

Une **immunité** est autre chose qu'une résistance. `resistances` réduit les
**dégâts** ; `immunities` annule l'**état** :

```json
"immunities": ["freeze"]
```

*P. fluorescens* pousse à 4 °C, la geler n'a aucun sens. Un simple `froid: 0`
n'aurait annulé que les dégâts du Gel de Listeria, pas le ralentissement qui va
avec — il fallait les deux mécanismes.

C'est ce qui donne à **S. aureus** son caractère : les jets de biocide des deux
microbiologistes ne lui font presque rien (18 dégâts tombent à 3), mais le bec
Bunsen le déchire (18 deviennent 29, et la brûlure passe de 7 à 11 dégâts par
seconde). Face à lui, la super attaque n'est plus un luxe mais le seul vrai
moyen de le sortir — ce qui est exactement le rapport de force réel : le
staphylocoque résiste très bien aux désinfectants de surface et très mal à la
chaleur.

### L'idle est animé

Les onze animations de chaque personnage comprennent une **boucle de repos** de
cinq frames : respiration, balancement, tentacules qui ondulent, lueur qui
pulse, poussière de spores qui retombe. C'est l'état où on regarde le
personnage le plus longtemps — en garde, entre deux échanges — et une image
fixe y faisait mannequin de vitrine.

Chaque perso respire à son rythme, et ça raconte quelque chose : *C. botulinum*
a une respiration lente et pénible qui déséquilibre sa spore, *L. monocytogenes*
une respiration courte et nerveuse, *S. putrefaciens* souffle son gaz par les
évents du dos à chaque expiration.

### L'équilibre

Avec dix-neuf personnages, l'équilibrage ne peut plus se faire à l'œil.
`scripts/equilibre.js` calcule, pour chacun, les dégâts d'une **séquence
complète** — poing, pied, spéciale — en incluant les effets continus, qu'on
oublie facilement : une brûlure de 3 s ajoute 21 dégâts, autant qu'un coup
entier.

C'est ce calcul qui a fait apparaître le problème. N. Appert et A. Evans
cumulaient de gros dégâts directs **et** de longues brûlures, et sortaient à 100
et 92 quand L. monocytogenes était à 29 : un écart de 3,45. Ce sont les
**durées** des effets qui ont été raccourcies, pas les dégâts directs, qui
portent l'identité du personnage. L'écart est retombé à **2,5**.

```
S. putrefaciens   81        K. Mullis         50
N. Appert         79        C. Fraser         48
A. Evans          76        A. flavus         42
Doc Gram          71        C. botulinum      39
R. Franklin       67        L. monocytogenes  32
```

**Le bas du tableau n'est pas le bas du classement.** Les deux derniers sont des
personnages de **contrôle** : le biofilm de Listeria la rend invulnérable une
seconde, la neurotoxine de C. botulinum paralyse 2,5 s. Ils gagnent en
empêchant l'autre de jouer, pas en tapant fort. De même, C. Fraser à 48 est la
seule à se soigner, et L. Pasteur à 55 a une spéciale à 10 dégâts qui cloue
l'adversaire presque deux secondes.

Un total de dégâts ne mesure donc qu'une moitié du personnage. Il sert à
repérer ce qui **cumule** dégâts et utilité — c'était le cas d'Appert et d'Evans
— pas à classer.

### Croisement

Dès que l'un des deux est en l'air, la séparation des corps est levée : on peut
**sauter par-dessus l'adversaire et atterrir de l'autre côté**. Les deux
continuent de se faire face, `facing` étant recalculé à chaque frame.

L'équilibrage de base reste homogène : les persos se différencient par
`moveSpeed`, `jumpVelocity`, `hurtbox`, `scale` et les portées de hitbox.

Ajouter un perso = un JSON dans `js/data/characters/`, une entrée dans
`scripts/characters.js`, et un appel `loadCharacter(...)` dans `boot()` de
`js/main.js`. Il apparaît alors tout seul dans le sélecteur et sur l'écran titre.

### Ce qui a été retiré

Doc Gram et Doc Pétri, les deux microbiologistes « maison » du départ, ont été
retirés du roster : Louis Pasteur couvre la microbiologie culturale et les neuf
scientifiques historiques les remplacent avantageusement. Leurs images de
référence restent dans `references/personnages/`, l'historique git conserve le
reste.

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
| `scripts/import-voices.js` | Télécharge, normalise et installe les voix depuis les banques CC0. |
| `scripts/voices.js` | La correspondance événement → extrait. **Le seul fichier à éditer pour changer une voix.** |
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

## Les voix

**Quatre voix, une par personnage**, dans
[`assets/audio/sfx/<perso>/`](assets/audio/sfx/README.md) : neuf sons chacune
(`punch`, `kick`, `superattack`, `hurt`, `ko`, `victory`, `jump`, `esquive`,
`nargue`).

| Personnage | Voix |
|---|---|
| **B. cereus** | Grognements de créature |
| **L. monocytogenes** | Grognements et bruits visqueux |
| **S. aureus** | Une grappe de petites voix empilées |
| **Salmonella** | Femme grave et arrogante |
| **C. botulinum** | Créature énorme et lente |
| **P. fluorescens** | Éthérée et liquide |
| **S. putrefaciens** | Bête à quatre pattes |
| **A. flavus** | Bruissement sec de spores |
| **Kary Mullis** | Homme vif |
| **Rosalind Franklin** | Femme mesurée |
| **József Baranyi** | Homme posé |
| **Emmanuelle Charpentier** | Femme tranchante |
| **Claire Fraser** | Femme assurée |
| **Alice Evans** | Femme âgée, sévère |
| **Nicolas Appert** | Homme massif |
| **Louis Pasteur** | Homme grave |
| **Élie Metchnikoff** | Homme âgé, chaleureux |

Elles proviennent de banques **CC0** d'OpenGameArt, et sont importées et
normalisées par `node scripts/import-voices.js`. La correspondance
événement → extrait tient dans un seul fichier,
[`scripts/voices.js`](scripts/voices.js) : changer une voix, c'est changer une
ligne puis relancer le script.

Le détail des sources, des licences et des pièges est dans le
[README du dossier](assets/audio/sfx/README.md).

> Les voix du jeu d'origine étaient celles de **personnes réelles** — approprié
> pour un jeu de famille, beaucoup moins pour un dépôt public. Elles ont été
> retirées et remplacées par ces extraits libres.

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
      characters/<perso>.json          dix personnages
      stages/<slug>.json
  assets/
    sprites/<perso>/<animation>/     ← les exports Pixellab arrivent ici
    stages/<slug>/background.png
    audio/sfx/<perso>/                ← les voix, une par perso
    audio/music/                             ← la musique, une seule piste
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
