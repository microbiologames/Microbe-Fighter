# Voix d'Amé — à enregistrer

Ce dossier est **vide volontairement**. Il est déjà branché sur la
microbiologiste **Doc Pétri** (`js/data/characters/petri.json`) : il suffit de
déposer les 9 fichiers ci-dessous ici, avec **exactement ces noms**, et ils
seront joués au prochain rechargement de la page. **Aucun code à modifier.**

| Fichier attendu | Joué quand | À enregistrer |
|---|---|---|
| `punch.wav` | coup de poing donné | Un petit cri d'effort (« Hya ! ») |
| `kick.wav` | coup de pied donné | Un petit cri d'effort (« Yah ! ») |
| `hurt.wav` | coup encaissé | Un « aïe ! » / grognement de douleur |
| `ko.wav` | mise K.O. | Un cri de chute / de défaite |
| `victory.wav` | manche gagnée | Un cri de victoire / un rire |
| `jump.wav` | saut | Un petit « hop ! » |
| `esquive.wav` | esquive (touche H / `;`) | Un souffle rapide, « pfiou ! » |
| `nargue.wav` | narguer (touche T / O) | Une petite pique moqueuse |
| `superattack.wav` | super attaque (Poing + Pied, jauge pleine) | Un cri long et puissant |

Format : **WAV**, court (moins d'une seconde, sauf `superattack` et `ko` qui
peuvent aller jusqu'à 2 s). Les voix des autres personnages, déjà en place dans
`assets/audio/sfx/nico/`, `raph/` et `margot/`, servent de référence de durée et
de niveau sonore.

En attendant, le jeu tourne normalement : `js/engine/Audio.js` avale l'erreur
quand un fichier est absent, Doc Pétri est simplement muette.

Pour vérifier ce qui manque encore :

```bash
node scripts/check-assets.js
```

Si tu préfères un autre format que le WAV (mp3, ogg), change l'extension dans le
bloc `"sfx"` de `js/data/characters/petri.json`.
