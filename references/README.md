# 📥 Dossier de dépôt — les images à transformer en personnages

**C'est ici que tu déposes tes images.** Le nom du fichier suffit à tout
brancher.

```
references/
  personnages/    ← les combattants
    gram.jpg          Doc Gram          (microbiologiste, voix de Nico)
    petri.jpg         Doc Pétri         (microbiologiste, voix d'Amé)
    cereus.jpg        B. cereus         (Bacillus cereus, voix de Raph)
    listeria.jpg      L. monocytogenes  (Listeria monocytogenes, voix de Margot)
  decors/         ← les fonds de scène — voir decors/README.md
    paillasse.jpg, hotte.jpg, ...
  prepared/       ← versions recadrées pour l'API (générées, ne pas éditer)
```

Deux natures d'image, deux sous-dossiers, deux README. Celui-ci couvre les
**personnages** ; les décors ont [le leur](decors/README.md).

Puis, pour chaque perso :

```bash
node scripts/prepare-reference.js gram    # recadre et redimensionne (1 fois par image)
node scripts/create-character.js gram     # crée le perso + récupère idle et portrait
node scripts/generate-sprites.js gram     # les 10 animations de combat
node scripts/measure-sprites.js --write   # cale groundY et scale sur les vrais sprites
node scripts/check-assets.js              # contrôle final
```

## Le nom du fichier compte, l'extension non

Le fichier doit s'appeler **exactement** comme l'`id` du personnage :
`gram`, `petri`, `cereus` ou `listeria`, et vivre dans
`references/personnages/`. Extensions acceptées : `.png`, `.jpg`, `.jpeg`,
`.webp`.

Un nom qui ne correspond à aucun perso ne sera jamais lu. Pour ajouter un
cinquième personnage, déclare-le d'abord dans `scripts/characters.js`, puis
crée son manifeste dans `js/data/characters/` et ajoute-le au `boot()` de
`js/main.js`.

## Ce qui fait une bonne image de référence

- **Personnage entier**, de la tête aux pieds, debout, **vu de face**.
  Pas besoin qu'il regarde à droite : Pixellab génère les 8 rotations, et le
  moteur retourne le sprite tout seul pour l'autre sens.
- **Fond uni**, blanc ou transparent.
- **Un seul personnage**, centré, sans décor ni accessoire au sol.
- Pixel art, dessin ou photo : les trois marchent.

### Le piège : les petits détails disparaissent

Le personnage est généré en **128×128**, puis affiché à une centaine de pixels
de haut. **Tout texte, logo ou motif fin devient trois pixels de bouillie.** Un
badge ou une inscription sur la blouse sera rendu comme une tache de couleur —
c'est normal, et c'est même ce qui rend le mieux.

Décris donc les éléments par leur **forme et leur couleur** dans
`scripts/characters.js`, jamais par leur contenu. « un badge rectangulaire teal
sur la poche poitrine » donne un bon résultat ; « un badge marqué ADRIA » n'en
donnera pas un meilleur.

À l'inverse, un trait de silhouette **survit très bien** et vaut la peine d'être
décrit : le spore dans l'abdomen de *B. cereus*, les flagelles, le rictus de
*Listeria*. C'est ce qui rend un perso reconnaissable à 100 px de haut.

### Et la leçon des 44 premières animations

Une description d'action qui ne nomme **que** le mouvement ou l'effet laisse le
générateur repeindre le personnage. « enormous white steam jet » a produit une
Doc Pétri entièrement en vapeur, cheveux compris ; *B. cereus*, dont chaque
action rappelle son corps vert et son spore, n'a eu **aucune frame ratée sur
onze**.

Donc : dans `scripts/characters.js`, **chaque action doit redire les deux ou
trois traits d'identité du perso**, et préciser pour les attaques que l'effet
part *vers l'avant, loin du corps*, qui reste visible.

## `prepare-reference.js` : l'étape obligatoire

L'API Pixellab **refuse toute image de plus de 1024×1024** (erreur 422), et une
photo où le personnage n'occupe qu'un sixième du cadre donne un résultat
médiocre. Le script règle les deux :

1. il détecte les bords du personnage (tout ce qui n'est pas le fond blanc) et
   recadre dessus, en carré, avec une petite marge ;
2. il redimensionne à 1024×1024 maximum.

Le résultat va dans `references/prepared/personnages/<perso>.png`, que
`create-character.js` préfère automatiquement. **Tes originaux ne sont jamais
modifiés.**

C'est le seul script du dépôt qui a une dépendance (Playwright, pour décoder
l'image — Node n'a pas de décodeur intégré). Si tu ne l'as pas, fais la même
chose à la main dans n'importe quel éditeur : recadre sur le personnage, exporte
un PNG carré de 1024×1024 max, dépose-le dans `references/prepared/`.

## Fichiers générés ici automatiquement

Après `create-character.js` :

```
references/personnages/gram.pixellab.json   { "characterId": "...", "creationJobId": "..." }
```

`generate-sprites.js` relit `characterId` tout seul — ne le supprime pas, sinon
il faudra repasser l'id à la main avec `--id`. `creationJobId` sert à
`--poses-only`, qui re-télécharge `idle/000.png` et `portrait.png` **sans
refaire** (ni repayer) le personnage :

```bash
node scripts/create-character.js gram --poses-only
```

Recréer un personnage écrase ce fichier ; l'ancien reste sur ton compte Pixellab.

## Les décors

Ils ont leur propre sous-dossier et leur propre mode d'emploi :
**[`references/decors/README.md`](decors/README.md)**.

## Corriger le rendu sans redéposer d'image

```bash
# essayer une autre description sans toucher characters.js
node scripts/create-character.js gram --description "a male microbiologist, ..."

# se passer complètement de l'image de référence
node scripts/create-character.js gram --no-reference

# refaire une seule animation qui ne va pas
node scripts/generate-sprites.js gram superattack
```

Chaque essai consomme des générations sur ton abonnement Pixellab.
