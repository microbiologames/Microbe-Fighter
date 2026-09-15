# 🖼️ Dépose ici les images des décors

**Une image par décor, nommée exactement comme son slug.** Le nom du fichier
suffit à tout brancher — rien à déclarer ailleurs.

```
references/decors/
  paillasse.jpg
  boite-de-petri.jpg
  hotte.jpg
  salle-de-culture.jpg
  congelateur.jpg
  autoclave.jpg
  microscope.jpg
  intestin.jpg
```

Puis :

```bash
node scripts/prepare-reference.js paillasse          # recadre et redimensionne
node scripts/generate-stage-background.js paillasse  # convertit en fond pixel art
```

ou d'un coup, pour tous ceux dont l'image est déposée :

```bash
node scripts/prepare-reference.js
node scripts/generate-stage-background.js --all
```

Le résultat atterrit dans `assets/stages/<slug>/background.png` et remplace
automatiquement le fond de repli en aplats.

## Les huit slugs

| Slug | Nom affiché | Ce que la description demande aujourd'hui |
|---|---|---|
| `paillasse` | Paillasse | Paillasse de labo en inox, becs Bunsen, portoirs, boîtes de Pétri, microscope |
| `boite-de-petri` | Boîte de Pétri | Intérieur d'une boîte géante : plaine de gélose ambrée, colonies en collines |
| `hotte` | Hotte à flux laminaire | Chambre stérile blanche, plan perforé, lampe UV bleue au plafond |
| `salle-de-culture` | Salle de culture | Rangées d'incubateurs CO₂ vitrés, microscope inversé, murs vert pâle |
| `congelateur` | Congélateur −80 °C | Racks givrés, cryoboîtes, brume bleue au sol |
| `autoclave` | Autoclave | Gros cylindre inox porte ouverte, vapeur, manomètres, voyants orange |
| `microscope` | Lame de microscope | Plaine de verre sous lamelle, grand disque de lumière du condenseur |
| `intestin` | Intestin grêle | Villosités roses en forêt de part et d'autre, sol muqueux, style cartoon |

Les descriptions complètes sont dans `scripts/generate-stage-background.js`,
constante `STAGES` — c'est là qu'on les retouche.

## Avec ou sans image

Les deux marchent, et le script choisit tout seul :

- **Avec** `references/decors/<slug>.jpg` → `image-to-pixelart-pro`, qui convertit
  fidèlement ta photo en pixel art. À privilégier : c'est toi qui décides de la
  composition.
- **Sans** → `generate-image-pixflux`, qui génère à partir de la seule
  description. Utile pour les décors qu'on ne peut pas photographier (l'intérieur
  d'une boîte de Pétri, un intestin).

## Ce qui fait un bon décor

- **Vue de côté**, cadrage large, comme un fond de scène de jeu de combat.
- **Un sol plat et dégagé au premier plan** : c'est là que les combattants se
  tiennent. Tout ce qui traîne au sol au milieu de l'image gênera la lecture.
- **Personne dans l'image.** Un humain dans le décor rentrera en concurrence
  avec les combattants.
- Ratio **16:9** de préférence. Le moteur recadre sans déformer (`drawCover`),
  donc un autre ratio marche mais perdra les bords.
- La sortie fait **512×288**, affichée sur un canvas de 384×216 : inutile de
  fournir une image énorme, le détail fin disparaîtra.

## Tant qu'un décor n'a pas son image

Rien n'est cassé : chaque décor a une **palette de repli** dans
`js/data/stages/<slug>.json`, et le moteur dessine le lieu en aplats de couleur
à partir de ces quatre teintes. Le décor reste reconnaissable et jouable.

```json
"palette": { "far": "#22313f", "mid": "#35506a", "floor": "#8d9daa", "accent": "#d3e6f1" }
```

Ajuster ces couleurs est aussi un moyen rapide de donner une ambiance à un décor
sans rien générer.

## Ajouter un neuvième décor

1. une entrée dans `STAGES` de `scripts/generate-stage-background.js` ;
2. un manifeste `js/data/stages/<slug>.json` avec `name`, `background` et `palette` ;
3. le slug dans `STAGE_FILES` en haut de `js/main.js`.

`node scripts/check-assets.js` vérifie que les trois sont cohérents.
