# 🎵 La musique du jeu

**Une seule piste, en boucle, du lancement jusqu'à la fin.** Pas de phases, pas
de bascule selon le moment du combat : elle démarre avec le jeu et ne s'arrête
plus.

Aujourd'hui : **`Flamme_pure.mp3`** — 192 kbps, 2 min 32, 3,6 Mo.

## Changer de musique

Dépose ton fichier ici et ajuste **une seule ligne**, en haut de `js/main.js` :

```js
const MUSIC = 'assets/audio/music/Flamme_pure.mp3';
```

`node scripts/check-assets.js` relit cette ligne et te dit si le fichier
correspondant manque.

## Le format

**Le mp3 et l'ogg sont lus nativement par tous les navigateurs, aucune
conversion n'est nécessaire.** Évite le WAV : non compressé, il pèse dix fois
plus pour une qualité que personne n'entendra sur un jeu pixel art. Les pistes
du jeu d'origine faisaient 27 Mo chacune contre 3,6 Mo ici.

Si ton mp3 n'a **pas d'en-tête Xing/Info**, comme celui-ci, le navigateur ne peut
pas déduire sa durée sans requêtes partielles. `server.js` gère donc les
requêtes `Range` (GitHub Pages les gère nativement), sans quoi `duration`
renvoie `Infinity` et la lecture en boucle devient hasardeuse.

## La lecture automatique

Depuis Chrome 66 et Safari 11, **un navigateur refuse de jouer un son avant que
la personne ait interagi avec la page**. La musique ne peut donc pas démarrer au
chargement seul.

`js/engine/Music.js` essaie quand même, et si c'est refusé, se réarme sur le
premier appui de touche ou clic. Comme l'écran titre demande d'appuyer sur
Entrée, la musique démarre en pratique au premier geste du joueur.

Si le fichier est absent ou illisible, le jeu tourne en silence sans broncher —
même tolérance que pour les voix manquantes.

## Régler le volume

À l'appel, dans `js/main.js` :

```js
startMusic(MUSIC, { volume: 0.45 });
```

`setMusicVolume()` permet de le changer en cours de partie si le besoin se
présente.

## À ne pas confondre

Les **voix** des personnages sont dans `assets/audio/sfx/<personne>/`. Celles
d'Amé restent à enregistrer — voir [`../sfx/ame/README.md`](../sfx/ame/README.md).

Les **jingles** (démarrage, début et fin de combat) sont dans
`assets/audio/sfx/jingle/` et sont déjà en place.

## Ce qui a été retiré

Le jeu d'origine avait quatre pistes (titre, ambiance, basse vie, victoire) avec
fondu enchaîné entre elles. Ce système est supprimé, ainsi que les motifs
Strudel qui les produisaient et `victory.wav`. Tout reste dans l'historique git
si besoin.
