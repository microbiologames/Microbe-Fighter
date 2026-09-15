# 📥 Dossier de dépôt — les images à transformer en personnages

**C'est ici que tu déposes tes images.** Rien d'autre à faire : le nom du fichier
suffit à tout brancher.

```
references/
  gram.png        ← Doc Gram      (microbiologiste, voix de Nico)
  petri.png       ← Doc Pétri     (microbiologiste, voix d'Amé)
  staphy.png      ← Staphy        (staphylocoque, voix de Raph)
  coli.png        ← Coli          (bacille, voix de Margot)
```

Puis, pour chaque perso déposé :

```bash
node scripts/create-character.js gram     # crée le perso + récupère idle et portrait
node scripts/generate-sprites.js gram     # les 10 animations de combat
node scripts/check-assets.js              # contrôle que rien ne manque
```

## Le nom du fichier compte, l'extension non

Le fichier doit s'appeler **exactement** comme l'`id` du personnage :
`gram`, `petri`, `staphy` ou `coli`. Les extensions acceptées sont `.png`,
`.jpg`, `.jpeg` et `.webp`, dans cet ordre de priorité.

Un nom qui ne correspond à aucun perso ne sera jamais lu. Pour ajouter un
cinquième personnage, déclare-le d'abord dans `scripts/characters.js` et
`js/data/characters/`.

## Ce qui fait une bonne image de référence

- **Personnage entier**, de la tête aux pieds, debout, **vu de face**.
  Pas besoin qu'il regarde à droite : Pixellab génère les rotations, et le
  moteur retourne le sprite tout seul pour l'autre sens.
- **Fond uni**, blanc ou transparent de préférence.
- **Un seul personnage** sur l'image, centré, sans décor ni accessoire au sol.
- Pixel art ou dessin : les deux marchent. Une photo marche aussi, le rendu
  sera juste plus interprété.

### Le piège : les petits détails disparaissent

Le personnage est généré en 128×128, puis affiché à environ 110 px de haut sur
un écran de 216 px. **Tout texte, logo ou motif fin devient trois pixels de
bouillie.** Un badge, un écusson ou une inscription sur la blouse seront rendus
comme une tache de couleur — c'est normal, et c'est même ce qui rend le mieux.

Décris donc les éléments par leur **forme et leur couleur** dans
`scripts/characters.js`, jamais par leur contenu. « un badge rectangulaire
teal sur la poche poitrine » donne un bon résultat ; « un badge marqué ADRIA »
n'en donnera pas un meilleur.

## Fichiers générés ici automatiquement

Après `create-character.js`, tu verras apparaître :

```
references/gram.character-id
```

C'est l'identifiant Pixellab du personnage. `generate-sprites.js` le relit tout
seul — ne le supprime pas, sinon il faudra repasser l'id à la main avec `--id`.
Recréer un personnage écrase ce fichier, et l'ancien personnage reste sur ton
compte Pixellab.

## Les décors aussi, si tu veux

Le même dossier sert aux décors, avec le slug du décor comme nom de fichier :

```
references/paillasse.jpg
references/hotte.jpg
```

`node scripts/generate-stage-background.js paillasse` utilisera la photo si elle
est là, et générera à partir de la seule description sinon. Les slugs
disponibles sont listés dans `js/data/stages/`.

## Corriger le rendu sans redéposer d'image

Si le personnage ne ressemble pas à ce que tu voulais, tu as deux leviers avant
de retoucher l'image :

```bash
# essayer une autre description sans toucher characters.js
node scripts/create-character.js gram --description "a male microbiologist, ..."

# se passer complètement de l'image de référence
node scripts/create-character.js gram --no-reference
```

Chaque essai consomme des générations sur ton abonnement Pixellab.
