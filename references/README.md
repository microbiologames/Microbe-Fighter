# 📥 Dossier de dépôt — les images à transformer en personnages

**C'est ici que tu déposes tes images.** Le nom du fichier suffit à tout
brancher.

```
references/
  personnages/    ← les combattants
    gram.jpg                    Doc Gram
    petri.jpg                   Doc Pétri
    cereus.jpg                  B. cereus
    listeria.jpg                L. monocytogenes
    Staphylococcus aureus.jpg   S. aureus
    Salmonella enterica.jpg     Salmonella
    Clostridium botulinum.jpg   C. botulinum
    Pseudomonas fluorescens.jpg P. fluorescens
    Shewanella putrefasciens.jpg S. putrefaciens   ← QUADRUPÈDE, voir plus bas
    Aspergillus flavus.jpg      A. flavus
  decors/         ← les fonds de scène — voir decors/README.md
    Labo.jpg, Labo (nuit).jpg
  prepared/       ← versions recadrées pour l'API (générées, ne pas éditer)
```

Deux natures d'image, deux sous-dossiers, deux README. Celui-ci couvre les
**personnages** ; les décors ont [le leur](decors/README.md).

Puis, pour chaque perso :

```bash
node scripts/prepare-reference.js gram    # recadre et redimensionne (1 fois par image)
node scripts/create-character.js gram     # crée le perso + récupère la pose fixe et le portrait
node scripts/generate-sprites.js gram     # les 11 animations, idle compris
node scripts/measure-sprites.js --write   # cale groundY et scale sur les vrais sprites
node scripts/check-assets.js              # contrôle final
```

## La taille du canevas décide de la ressemblance

`create-character.js` demande **168 x 168**, le maximum accepté en entrée.

On a longtemps généré en 128, et la ressemblance aux photos en pâtissait : à
cette taille un visage occupe une dizaine de pixels, ce qui ne suffit pas à
distinguer deux personnes. Le même prompt en 168 change tout — sur E.
Charpentier, le 128 sortait un garçon brun en tunique bleue, le 168 une femme
aux cheveux bouclés volumineux en blouse blanche.

**Piège de la documentation :** elle annonce un canevas « pouvant aller jusqu'à
256 px », mais c'est le canevas **persisté**, qui grandit tout seul pour loger le
personnage. Demander 192 est refusé avec un 422, `image_size` étant plafonné à
168. C'est ainsi que les sprites de Family Fight font 256 px alors que personne
n'a jamais demandé cette taille.

## Décrire un visage, pas une fonction

L'autre moitié de la ressemblance est dans la description. « an elderly male
scientist in a white lab coat » laisse le générateur inventer un visage. Il faut
nommer ce qui distingue **cette** personne :

- l'âge, en années, pas « elderly » ;
- la **ligne de cheveux** : dégarni sur le dessus, cheveux aux tempes, raie de
  côté, volume autour du visage ;
- la **forme de la barbe** — « a full bushy grey beard and moustache covering
  his jaw and upper lip » plutôt que « bearded » ;
- les **lunettes**, leur monture ;
- le vêtement distinctif, qui est souvent ce qui se lit le mieux à cette taille :
  la chemise à carreaux orange de K. Mullis, le col haut bleu de N. Appert, le
  collier de perles d'A. Evans.

## Valider la pose avant d'animer

Dix animations coûtent dix jobs. Les lancer sur un personnage qui ne ressemble
pas, c'est dix jobs perdus.

```bash
node scripts/create-character.js pasteur     # crée + récupère la pose de face
node scripts/comparer-poses.js pasteur       # la met À CÔTÉ de la référence
# on regarde, et seulement si ça convient :
node scripts/generate-sprites.js pasteur
```

`comparer-poses.js` écrit une planche avec la photo de référence à gauche et la
pose générée à droite, personnage par personnage. C'est la seule étape du
pipeline qui demande un œil humain — tout le reste se vérifie par un script.

## L'idle est une animation, pas une pose

`create-character.js` dépose une **pose fixe** dans `assets/sprites/<perso>/idle/000.png`,
récupérée des rotations du personnage. Elle sert de filet : tant que les
animations ne sont pas générées, le perso s'affiche quand même.

`generate-sprites.js` la **remplace** ensuite par une vraie boucle de cinq
frames — respiration, balancement, ce qui donne vie au personnage à l'arrêt.
`idle` fait partie d'`ANIMATION_ORDER`, donc **tout personnage ajouté par la
suite l'aura sans rien avoir à faire** : il suffit de lui écrire une description
`idle` dans `scripts/characters.js`, comme pour les dix autres.

Deux conséquences à connaître :

- **Ne relance pas `create-character.js --poses-only` après coup.** Il réécrirait
  `idle/000.png` avec la pose fixe, sur un canevas plus petit que les quatre
  autres frames, et le personnage sauterait d'une frame à l'autre. Si ça arrive,
  `node scripts/generate-sprites.js <perso> idle` répare tout.
- **`measure-sprites.js` prend l'idle comme référence** pour le `scale` et la
  ligne de sol de toutes les autres animations. Il faut donc le **re-mesurer
  après** avoir généré l'idle, pas avant.

## Un quadrupède se décide à la CRÉATION, jamais après

`template_id` choisit le **squelette 3D** auquel Pixellab ajuste les frames.
`mannequin` est le seul bipède ; `bear`, `cat`, `dog`, `horse` et `lion` sont
quadrupèdes et ajoutent d'eux-mêmes « on all fours » à la description.

```js
// dans scripts/characters.js
shewanella: {
  template: 'cat',   // sans cette ligne, il sortirait debout sur deux pattes
  ...
}
```

**Se tromper ici ne se rattrape pas plus tard.** L'endpoint d'animation ne prend
pas de template : il hérite de celui du personnage. Un quadrupède créé en
`mannequin` se redressera sur deux pattes à *chacune* des dix animations, et il
faudra tout refaire depuis la création.

**Cette leçon a été apprise deux fois sur le même personnage.** *S.
putrefaciens* est d'abord sorti en quadrupède du générateur d'images, d'où un
`template: 'cat'` choisi pour sa silhouette basse et sa longue queue, et un
`heightStand` de 72 au lieu d'une centaine. Une seconde image de référence,
bipède celle-là, a tout inversé : retour à `mannequin` et à 110 px de haut.

Le coût de l'erreur est asymétrique. Changer le template **avant** de recréer le
personnage ne coûte qu'une création ; s'en apercevoir après coup, c'est une
création plus onze animations à refaire. D'où la règle : **vérifier le nombre de
pattes sur l'image de référence avant de lancer quoi que ce soit.**

## Le nom du fichier compte, l'extension non

Le fichier doit porter soit l'`id` du personnage (`gram`, `cereus`…), soit le nom
déclaré dans le champ `reference` de `scripts/characters.js` — ce qui permet de
déposer `Salmonella enterica.jpg` sans le renommer. Il doit vivre dans
`references/personnages/`. Extensions acceptées : `.png`, `.jpg`, `.jpeg`,
`.webp`.

Un nom qui ne correspond à aucun perso ne sera jamais lu. Pour ajouter un
personnage, déclare-le d'abord dans `scripts/characters.js`, puis
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
