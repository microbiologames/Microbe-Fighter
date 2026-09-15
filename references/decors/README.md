# 🖼️ Dépose ici les images des décors

**Une image par décor.** Le nom du fichier suffit : la ponctuation, les espaces
et les accents sont ignorés, donc `Labo (nuit).jpg` correspond au slug
`labo-nuit`.

```
references/decors/
  Labo.jpg          -> labo       (Laboratoire, jour)
  Labo (nuit).jpg   -> labo-nuit  (Laboratoire, nuit)
```

Le jeu tourne aujourd'hui sur ces deux décors, deux vues du même laboratoire
ADRIA. Les huit décors thématiques d'avant (paillasse, boîte de Pétri, hotte,
congélateur, autoclave, salle de culture, intestin, lame de microscope) ont été
retirés ; ils restent dans l'historique git.

## Importer un décor panoramique

Un décor **plus large que l'écran** fait défiler la scène : la caméra suit le
milieu des deux combattants et bute sur les bords. Les deux labos font
**1076×216 px, soit 2,8 écrans et 692 px de défilement**.

L'import n'appelle **aucune API** — l'image est déjà en pixel art, il n'y a qu'à
la cadrer :

```bash
node scripts/import-wide-stage.js labo --floor-ratio 0.88 --height 300 --grid
```

## Le cadrage, c'est tout le sujet

Deux valeurs, et ce sont elles qui décident si les combattants marchent sur le
carrelage ou sur les paillasses.

| Réglage | Ce que c'est |
|---|---|
| `floorRatio` | La hauteur, **dans l'image source**, de la ligne où les pieds se posent. `0.88` = à 88 % en partant du haut. |
| `height` | La hauteur à laquelle mettre l'image entière, en pixels de jeu. C'est le **zoom** : plus elle est grande, plus on entre dans la pièce et plus les combattants paraissent petits par rapport au mobilier. |

Le script découpe la fenêtre de 216 px qui amène la ligne de sol pile sur celle
du moteur, et dit combien de pixels il a rognés en haut et en bas.

**Le réglage retenu pour les labos — `floorRatio 0.88`, `height 300` — n'est pas
arbitraire.** À 0,79, la ligne de sol tombait au pied des paillasses et les
combattants semblaient encastrés dans le mobilier. En la descendant à 0,88, ils
se tiennent au milieu de la bande de carrelage dégagée, nettement au premier
plan, et leur tête arrive à hauteur des plans de travail — ce qui est la bonne
proportion pour quelqu'un debout devant une paillasse.

### `--grid` : régler sans relancer le jeu

L'option écrit `assets/stages/<slug>/reperes.png` : le décor avec **la ligne de
sol tracée en rouge** et des silhouettes de combattants à la taille réelle
(116 px). On regarde, on ajuste, on relance. C'est bien plus rapide que de
lancer une partie. Pense à supprimer ce fichier une fois réglé.

Les valeurs retenues sont mémorisées dans `js/data/stages/<slug>.json`, donc un
réimport sans argument repart du même cadrage.

## Ce qui fait un bon panoramique

Le premier décor du labo ne marchait pas bien, le second oui : la différence
tient à un seul point.

- ✅ **Une bande de sol vide et continue sur toute la largeur**, meubles
  repoussés vers le haut du cadre. C'est là que les combattants se tiennent.
- ❌ Des paillasses au premier plan, à des hauteurs différentes selon l'endroit :
  aucun réglage unique ne peut convenir, les persos marchent sur le mobilier à
  certains endroits et dans le vide à d'autres.
- **Vue de face, de côté**, comme un fond de scène de jeu de combat — pas une
  perspective fuyante.
- **Personne dans l'image** : un humain dans le décor entre en concurrence avec
  les combattants.
- Très large : 3 à 4 fois la largeur de l'écran donne un vrai terrain de jeu.
  Les labos font 3904 px de large en source.

## Générer un décor au lieu de le fournir

`scripts/generate-stage-background.js` passe par l'API Pixellab, avec ou sans
photo de référence. Il produit une image à la taille de l'écran, **sans
défilement** — c'est l'outil pour un décor simple, pas pour un panoramique.

## Tant qu'un décor n'a pas son image

Rien n'est cassé : chaque décor a une **palette de repli** dans son manifeste, et
le moteur dessine le lieu en aplats de couleur à partir de ces quatre teintes.

```json
"palette": { "far": "#2a2c44", "mid": "#3a3d5c", "floor": "#8f97ad", "accent": "#7ee3b8" }
```

## Ajouter un décor

1. déposer l'image ici ;
2. `node scripts/import-wide-stage.js <slug> --grid`, et régler le cadrage ;
3. ajouter le slug à `STAGE_FILES`, en haut de `js/main.js`.

`node scripts/check-assets.js` vérifie que manifeste, image et `STAGE_FILES`
sont cohérents.
