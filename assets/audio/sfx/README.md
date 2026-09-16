# 🔊 Les voix des personnages

**Neuf sons par personnage, un dossier par personnage.** Ils sont référencés
dans le bloc `"sfx"` de `js/data/characters/<perso>.json`.

```
assets/audio/sfx/
  gram/       Doc Gram          — voix d'homme
  petri/      Doc Pétri         — voix de femme
  cereus/     B. cereus         — grognements de créature
  listeria/   L. monocytogenes  — grognements et bruits visqueux
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
node scripts/import-voices.js            # les quatre
node scripts/import-voices.js --list     # ce qui serait importé, sans rien écrire
```

Le script télécharge, convertit et **retravaille chaque extrait** pour qu'il
tienne dans un jeu de combat :

- mono 44,1 kHz 16 bits, quelle que soit la source (wav, ogg ou mp3) ;
- **silence de tête et de queue coupé** — un son de combat doit partir à
  l'instant du coup, pas 200 ms plus tard ;
- **crête normalisée**, pour que les quatre personnages soient au même niveau ;
- fondu de 5 ms aux deux bouts, contre les claquements ;
- tronqué à 2,5 s.

Il affiche la durée obtenue et ce qu'il a coupé, ce qui permet de repérer les
extraits inadaptés.

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
