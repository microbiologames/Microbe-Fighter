# 🔊 Les voix des personnages

**Neuf sons par personnage, un dossier par personnage.** Ils sont référencés
dans le bloc `"sfx"` de `js/data/characters/<perso>.json`.

```
assets/audio/sfx/
  gram/       Doc Gram          — voix d'homme
  petri/      Doc Pétri         — voix de femme
  cereus/     B. cereus         — grognements de créature
  listeria/   L. monocytogenes  — grognements et bruits visqueux
  staph/      S. aureus         — une grappe de petites voix (voir plus bas)
```

Chaque dossier contient : `punch` · `kick` · `superattack` · `hurt` · `ko` ·
`victory` · `jump` · `esquive` · `nargue`, en `.wav`.

## D'où ils viennent

Tous les extraits proviennent de banques **CC0 (domaine public)** d'OpenGameArt.

| Source | Utilisée pour | Licence |
|---|---|---|
| [Steampunk Fantasy Voices](https://opengameart.org/content/steampunk-fantasy-voices) | Doc Gram (« Hero »), B. cereus (« Minion ») | CC0 |
| [Female RPG Voice Starter Pack](https://opengameart.org/content/female-rpg-voice-starter-pack) — Cici Fyre | Doc Pétri | CC0 |
| [16 Monster Growls](https://opengameart.org/content/16-monster-growls) — StarNinjas | L. monocytogenes | CC0 |
| [10 Slime / Water Monster](https://opengameart.org/content/10-slimewater-monsterwater) — StarNinjas | L. monocytogenes (saut, esquive) | CC0 |
| [Hurt Sound Effects](https://opengameart.org/content/hurt-sound-effects) | Doc Gram (douleur, esquive) | CC0 |

S. aureus ne puise dans aucune source nouvelle : sa voix est fabriquée à partir
des trois packs de créatures ci-dessus, empilés et transposés — voir plus bas.

**Le CC0 n'était pas un hasard.** Le dépôt est public : une licence à partage à
l'identique — CC-BY-SA, très répandue sur OpenGameArt — aurait contaminé le
projet entier. Plusieurs packs de meilleure qualité ont été écartés pour ça,
dont *EFFORT SOUNDS (Male)*, en CC-BY-SA 4.0.

Le CC0 n'oblige pas à créditer ; ce tableau le fait quand même, et permet de
retrouver l'origine d'un son.

## Changer une voix

Tout passe par **[`scripts/voices.js`](../../../scripts/voices.js)**, qui associe
chaque événement à un extrait. Modifier une ligne, puis :

```bash
node scripts/import-voices.js petri      # ré-importe un personnage
node scripts/import-voices.js            # tous
node scripts/import-voices.js --list     # ce qui serait importé, sans rien écrire
```

Le script télécharge, convertit et **retravaille chaque extrait** pour qu'il
tienne dans un jeu de combat :

- mono 44,1 kHz 16 bits, quelle que soit la source (wav, ogg ou mp3) ;
- **silence de tête et de queue coupé** — un son de combat doit partir à
  l'instant du coup, pas 200 ms plus tard ;
- **crête normalisée**, pour que tous les personnages soient au même niveau ;
- fondu de 5 ms aux deux bouts, contre les claquements ;
- tronqué à 2,5 s.

Il affiche la durée obtenue et ce qu'il a coupé, ce qui permet de repérer les
extraits inadaptés.

## La voix de grappe de S. aureus

S. aureus n'est pas un individu : c'est un **amas de coques dorées**, chacune
avec sa propre petite tête. Lui donner une seule voix aurait sonné faux.

Un événement peut donc empiler **plusieurs extraits** au lieu d'un seul. Dans
`scripts/voices.js`, on écrit une liste de couches
`[source, fichier, demiTons, decalageMs]` :

```js
punch: [
  ['steampunk', 'Minion_Attack_001_0.wav', 7],
  ['monstres',  'monster.3.ogg',           11],
  ['steampunk', 'Minion_Attack_002_0.wav', 4],
],
```

Chaque couche est **jouée plus vite** pour monter dans l'aigu — `demiTons` 12
correspond à une octave, donc à une voix deux fois plus petite et plus vive —
puis **décalée de 30 ms** sur la précédente. Ce décalage est ce qui compte :
sans lui, les trois cris partent exactement ensemble et on entend un seul gros
monstre au timbre bizarre ; avec lui, on entend plusieurs bestioles qui râlent
presque en même temps.

Les couches sont mises à un niveau commun avant d'être mélangées, la première
portant le son et les suivantes remplissant derrière (`1/√n`). Sans cette
égalisation, l'extrait le plus fort écrase les autres et la normalisation finale
ne rattrape que le volume, pas l'équilibre.

Détail d'implémentation qui a son importance : **quand il n'y a qu'une couche —
le cas des quatre autres personnages — le calcul est exactement celui d'avant,
au bit près.** Ajouter l'empilement n'a modifié aucune voix existante.

## Le piège : les répliques parlées

Beaucoup de « voix » de banques libres sont des **phrases jouées**, pas des
interjections. Les réactions de dégât du pack steampunk font **2,5 s et plus** :
rejouées à chaque coup encaissé, c'est intenable.

D'où le choix, pour Doc Gram, d'un pack de douleur distinct pour `hurt` et
`esquive`, et de ses deux cris d'attaque les plus courts (0,4 et 0,5 s) pour les
coups simples, le plus long étant réservé à la super attaque.

**Règle générale : moins de 0,5 s pour ce qui se répète** (poing, pied, douleur,
saut, esquive), on peut aller jusqu'à 1,5 s pour ce qui est rare (K.O., victoire,
narguer).

## Déposer ses propres enregistrements

Rien n'oblige à passer par le script : déposer neuf `.wav` aux bons noms dans le
dossier d'un personnage suffit, sans toucher au code. C'est ainsi que
fonctionnaient les voix d'origine.
