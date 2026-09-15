# 🎵 Dépose ici la musique du jeu

**Quatre pistes, quatre noms exacts.** Déposer le fichier suffit : il est joué au
prochain rechargement de la page, **sans aucun code à modifier**.

| Fichier attendu | Jouée quand | Doit boucler |
|---|---|---|
| `title-screen.wav` | Écran titre, sélection du perso et du décor | ✅ oui |
| `ambient-theme.wav` | Pendant le combat | ✅ oui |
| `combat-low-hp.wav` | Dès qu'un combattant passe **sous 50 PV** — bascule automatique, en fondu | ✅ oui |
| `victory.wav` | Écran de fin de match | non (3,5 s suffisent) |

Seul `victory.wav` est aujourd'hui dans le dépôt. Les trois autres manquent :
le jeu tourne en silence sur ces moments-là, `js/engine/Music.js` étant tolérant
à l'absence de fichier, exactement comme `Audio.js` pour les voix.

## Pourquoi les trois grosses pistes ne sont pas versionnées

Elles existaient dans le jeu d'origine (`sf-pixel-fight`) mais pesaient **27 Mo
chacune** — 2 min 35 en WAV stéréo 44,1 kHz non compressé, soit 82 Mo pour trois
fichiers. Les mettre dans l'historique d'un dépôt git est **irréversible**, et
chaque visiteur de la page les télécharge.

Le **motif Strudel qui les a produites** est conservé à côté, dans les fichiers
`.js` de ce dossier : `title-screen.js`, `ambient-theme.js`, `combat-low-hp.js`,
`victory.js`. Ce sont des partitions en livecoding, à rejouer sur
[strudel.cc](https://strudel.cc) pour régénérer ou retravailler les morceaux.

## Le format : préfère l'ogg ou le mp3

Le WAV n'est pas compressé. Pour une boucle de 2-3 minutes, compter **27 Mo en
WAV contre 2 à 3 Mo en ogg** à qualité équivalente à l'oreille sur un jeu pixel
art. C'est dix fois moins à télécharger.

Si tu déposes autre chose que du `.wav`, il faut ajuster **quatre lignes**, en
haut de `js/main.js` :

```js
const TITLE_MUSIC = 'assets/audio/music/title-screen.wav';
const AMBIENT_MUSIC = 'assets/audio/music/ambient-theme.wav';
const COMBAT_LOW_HP_MUSIC = 'assets/audio/music/combat-low-hp.wav';
const VICTORY_MUSIC = 'assets/audio/music/victory.wav';
```

Le serveur local et les navigateurs servent déjà `.ogg` et `.mp3` sans rien
configurer (voir la table `MIME` de `server.js`).

## Comment la musique s'enchaîne

`js/engine/Music.js` fait un **fondu enchaîné** entre deux pistes, et ne
redémarre jamais une piste déjà en cours. Concrètement :

- titre → sélection : la même piste continue, sans coupure ;
- début de combat : fondu vers `ambient-theme` ;
- passage sous 50 PV : fondu vers `combat-low-hp`, et on n'en ressort pas avant
  la fin de la manche ;
- fin de match : fondu vers `victory`.

Les volumes sont réglés à l'appel, dans `js/main.js` : 0,5 pour le titre et
l'ambiance, 0,55 en basse vie, 0,6 pour la victoire.

## Vérifier ce qui manque

```bash
node scripts/check-assets.js
```

Il liste les pistes absentes sous « À faire », sans jamais bloquer.

## À ne pas confondre

Les **voix** des personnages ne vont pas ici : elles sont dans
`assets/audio/sfx/<personne>/`. Celles d'Amé restent à enregistrer — voir
[`../sfx/ame/README.md`](../sfx/ame/README.md).

Les **jingles** (démarrage, début et fin de combat) sont dans
`assets/audio/sfx/jingle/` et sont déjà en place.
