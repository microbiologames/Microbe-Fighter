// Correspondance entre les 9 événements sonores du jeu et les extraits de
// banques libres qui les jouent, personnage par personnage.
//
// C'EST LE SEUL FICHIER À ÉDITER pour changer une voix : modifier une ligne ici
// puis relancer `node scripts/import-voices.js <perso>`.
//
// --- Licences ---------------------------------------------------------------
//
// Toutes les sources sont en **CC0 (domaine public)**, choisies pour ça : le jeu
// est dans un dépôt public, et une licence à partage à l'identique (CC-BY-SA,
// très courante sur OpenGameArt) l'aurait contaminé en entier. Plusieurs packs
// autrement excellents ont été écartés pour cette raison.
//
// Le CC0 n'oblige pas à créditer, mais SOURCES ci-dessous le fait quand même :
// c'est la moindre des choses, et ça permet de retrouver l'origine d'un son.

const SOURCES = {
  steampunk: {
    titre: 'Steampunk Fantasy Voices',
    page: 'https://opengameart.org/content/steampunk-fantasy-voices',
    licence: 'CC0',
    base: 'https://opengameart.org/sites/default/files/',
  },
  femaleRpg: {
    titre: 'Female RPG Voice Starter Pack — Cici Fyre',
    page: 'https://opengameart.org/content/female-rpg-voice-starter-pack',
    licence: 'CC0',
    archive: 'https://opengameart.org/sites/default/files/RPG%20Voice%20Starter%20Pack.zip',
    // Le pack contient TROIS voix féminines distinctes (Type 1 à 3). `prefixe`
    // donne celle par défaut ; les autres s'atteignent en préfixant le nom du
    // fichier, par exemple 'Type 2/attack1.wav'. C'est ce qui permet de donner
    // à Salmonella une voix qui n'est pas celle de Doc Pétri.
    prefixe: 'RPG Voice Starter Pack/Type 1/',
  },
  monstres: {
    titre: '16 Monster Growls — StarNinjas',
    page: 'https://opengameart.org/content/16-monster-growls',
    licence: 'CC0',
    archive: 'https://opengameart.org/sites/default/files/monster_-_starninjas.zip',
    prefixe: '',
  },
  // Quatre réactions de douleur très courtes. Les voix « héroïques » du pack
  // steampunk sont des RÉPLIQUES PARLÉES de 2 s et plus : insupportable à chaque
  // coup encaissé, il faut un son bref.
  douleurCourte: {
    titre: 'Hurt Sound Effects',
    page: 'https://opengameart.org/content/hurt-sound-effects',
    licence: 'CC0',
    base: 'https://opengameart.org/sites/default/files/',
  },
  slime: {
    titre: '10 Slime / Water Monster — StarNinjas',
    page: 'https://opengameart.org/content/10-slimewater-monsterwater',
    licence: 'CC0',
    archive: 'https://opengameart.org/sites/default/files/slime_-_starninjas.zip',
    prefixe: '',
  },
};

// Les 9 événements, dans l'ordre où le joueur les rencontre.
const EVENTS = ['punch', 'kick', 'superattack', 'hurt', 'ko', 'victory', 'jump', 'esquive', 'nargue'];

// `[source, fichier]` pour chaque événement.
//
// Un personnage peut aussi EMPILER plusieurs extraits sur un même événement :
// on donne alors une liste de couches `[source, fichier, demiTons, decalageMs]`,
// et import-voices.js les transpose, les décale et les mélange en un seul son.
// `demiTons` monte ou descend la hauteur (12 = une octave au-dessus) ; c'est ce
// qui fabrique une « petite » voix. `decalageMs` est optionnel : sans lui, les
// couches sont décalées de 30 ms l'une après l'autre, ce qui donne une bouillie
// de voix qui parlent presque ensemble plutôt qu'un choeur trop propre.
const VOICES = {
  // --- Doc Gram : voix d'homme classique -----------------------------------
  // Le « Hero » du pack steampunk : timbre grave, articulé, sans accent marqué.
  // Les deux cris d'attaque les plus courts servent aux coups simples, le plus
  // long à la super. Overwhelmed et Semiwhelmed, les deux répliques de 2 s du
  // pack, sont écartées au profit de réactions brèves.
  gram: {
    voix: 'homme',
    punch:       ['steampunk', 'Hero_Attack_002_0.wav'],
    kick:        ['steampunk', 'Hero_Attack_003_0.wav'],
    superattack: ['steampunk', 'Hero_Attack_001_0.wav'],
    hurt:        ['douleurCourte', 'hurt_02.mp3'],
    ko:          ['steampunk', 'Hero_Die_001_0.wav'],
    victory:     ['steampunk', 'Hero_Kill_001_0.wav'],
    jump:        ['steampunk', 'Hero_Bomb_001_0.wav'],
    esquive:     ['douleurCourte', 'hurt_04.mp3'],
    nargue:      ['steampunk', 'Hero_Taunt_001_0.wav'],
  },

  // --- Doc Pétri : voix de femme classique ---------------------------------
  // Les fichiers sont déjà nommés par action, la correspondance est directe.
  petri: {
    voix: 'femme',
    punch:       ['femaleRpg', 'attack1.wav'],
    kick:        ['femaleRpg', 'attack2.wav'],
    superattack: ['femaleRpg', 'attack3.wav'],
    hurt:        ['femaleRpg', 'damaged1.wav'],
    ko:          ['femaleRpg', 'damaged3.wav'],
    victory:     ['femaleRpg', 'healed1.wav'],
    jump:        ['femaleRpg', 'jump1.wav'],
    esquive:     ['femaleRpg', 'jump2.wav'],
    nargue:      ['femaleRpg', 'curse.wav'],
  },

  // --- B. cereus : le « mob » ----------------------------------------------
  // Le « Minion » du pack steampunk : grognements gutturaux de sbire, exactement
  // le registre voulu pour une bactérie qui cogne.
  cereus: {
    voix: 'créature',
    punch:       ['steampunk', 'Minion_Attack_001_0.wav'],
    kick:        ['steampunk', 'Minion_Attack_002_0.wav'],
    superattack: ['steampunk', 'Minion_Sword_001.wav'],
    hurt:        ['steampunk', 'Minion_Bombed_001_0.wav'],
    ko:          ['steampunk', 'Minion_DieImpact_001_0.wav'],
    victory:     ['steampunk', 'Minion_Sword_003.wav'],
    jump:        ['steampunk', 'Minion_Sword_002.wav'],
    esquive:     ['steampunk', 'Minion_Feared_001.wav'],
    nargue:      ['steampunk', 'Minion_Drunk_001.wav'],
  },

  // --- L. monocytogenes : grognements et bruits visqueux --------------------
  // Les growls pour les coups et les cris, le slime pour le saut et l'esquive —
  // ce qui colle à son biofilm.
  listeria: {
    voix: 'créature',
    punch:       ['monstres', 'monster.4.ogg'],
    kick:        ['monstres', 'monster.7.ogg'],
    superattack: ['monstres', 'monster.11.ogg'],
    hurt:        ['monstres', 'monster.2.ogg'],
    ko:          ['monstres', 'monster.14.ogg'],
    victory:     ['monstres', 'monster.9.ogg'],
    jump:        ['slime', 'slime.3.ogg'],
    esquive:     ['slime', 'slime.7.ogg'],
    nargue:      ['monstres', 'monster.5.ogg'],
  },

  // --- S. aureus : une grappe de coques, donc une grappe de voix -------------
  // Le personnage n'est pas un individu : c'est un amas de cocci dorés, chacun
  // avec sa propre petite tête. Une seule voix aurait sonné faux. Chaque
  // événement empile donc deux ou trois extraits, transposés vers l'aigu de 4 à
  // 14 demi-tons et décalés de quelques dizaines de millisecondes : on entend
  // plusieurs petites bestioles qui râlent en même temps sans tout à fait se
  // synchroniser.
  //
  // La coagulase et le saut piochent dans le pack slime : le plasma qui prend en
  // masse demande un son visqueux, pas un cri.
  staph: {
    voix: 'grappe',
    punch: [
      ['steampunk', 'Minion_Attack_001_0.wav', 7],
      ['monstres',  'monster.3.ogg',           11],
      ['steampunk', 'Minion_Attack_002_0.wav', 4],
    ],
    kick: [
      ['slime',    'slime.2.ogg',   6],
      ['monstres', 'monster.6.ogg', 10],
      ['slime',    'slime.5.ogg',   13],
    ],
    superattack: [
      ['steampunk', 'Minion_Sword_001.wav', 5],
      ['monstres',  'monster.11.ogg',       9],
      ['monstres',  'monster.13.ogg',       14],
    ],
    hurt: [
      ['monstres',  'monster.2.ogg',            8],
      ['steampunk', 'Minion_Bombed_001_0.wav',  12],
      ['monstres',  'monster.8.ogg',            5],
    ],
    ko: [
      ['steampunk', 'Minion_DieImpact_001_0.wav', 6],
      ['monstres',  'monster.14.ogg',             10],
      ['monstres',  'monster.1.ogg',              13],
    ],
    victory: [
      ['steampunk', 'Minion_Sword_003.wav',  7],
      ['monstres',  'monster.9.ogg',         11],
      ['steampunk', 'Minion_Drunk_001.wav',  4],
    ],
    jump: [
      ['slime', 'slime.3.ogg', 9],
      ['slime', 'slime.8.ogg', 14],
    ],
    esquive: [
      ['steampunk', 'Minion_Feared_001.wav', 8],
      ['slime',     'slime.7.ogg',           12],
    ],
    nargue: [
      ['steampunk', 'Minion_Drunk_001.wav',  6],
      ['monstres',  'monster.5.ogg',         10],
      ['steampunk', 'Minion_Feared_001.wav', 14],
    ],
  },

  // --- Salmonella : la voix de la mechante sure d'elle -----------------------
  // Type 2 du pack feminin, DESCENDU de quatre a six demi-tons : le timbre perd
  // sa clarte et gagne une autorite un peu inquietante, tres loin de Doc Petri
  // qui utilise le Type 1 tel quel. Les coups portes ajoutent une couche de
  // grognement pour le poids des tentacules metalliques.
  salmonella: {
    voix: 'femme grave, arrogante',
    punch: [
      ['femaleRpg', 'Type 2/attack1.wav', -5],
      ['monstres',  'monster.12.ogg',     -2],
    ],
    kick: [
      ['femaleRpg', 'Type 2/attack2.wav', -4],
      ['monstres',  'monster.16.ogg',     -3],
    ],
    superattack: [
      ['femaleRpg', 'Type 2/attack3.wav', -6],
      ['monstres',  'monster.11.ogg',     -4],
    ],
    hurt:    [['femaleRpg', 'Type 2/damaged1.wav', -5]],
    ko:      [['femaleRpg', 'Type 2/damaged3.wav', -6]],
    victory: [['femaleRpg', 'Type 2/healed1.wav',  -4]],
    jump:    [['femaleRpg', 'Type 2/jump1.wav',    -4]],
    esquive: [['femaleRpg', 'Type 2/jump2.wav',    -5]],
    nargue:  [['femaleRpg', 'Type 2/curse.wav',    -5]],
  },

  // --- C. botulinum : enorme, lent, sous pression ----------------------------
  // Des grognements DESCENDUS de six a huit demi-tons. La transposition vers le
  // grave allonge aussi le son - un grognement d'une seconde en fait 1,6 - ce
  // qui tombe juste pour un personnage qui traine des pieds. Deux couches
  // decalees de 60 ms au lieu de 30 : le decalage plus large donne une seconde
  // attaque du son, comme une respiration qui suit le rale.
  botulinum: {
    voix: 'creature enorme et lente',
    punch:       [['monstres', 'monster.13.ogg', -7], ['monstres', 'monster.6.ogg', -4, 60]],
    kick:        [['monstres', 'monster.15.ogg', -6], ['slime',    'slime.9.ogg',   -5, 70]],
    superattack: [['monstres', 'monster.10.ogg', -8], ['monstres', 'monster.3.ogg', -5, 80]],
    hurt:        [['monstres', 'monster.8.ogg',  -6]],
    ko:          [['monstres', 'monster.1.ogg',  -8]],
    victory:     [['monstres', 'monster.16.ogg', -7]],
    jump:        [['slime',    'slime.6.ogg',    -6]],
    esquive:     [['slime',    'slime.10.ogg',   -5]],
    nargue:      [['monstres', 'monster.12.ogg', -7]],
  },

  // --- P. fluorescens : etheree et visqueuse ---------------------------------
  // Le seul perso dont la voix monte : le pack slime transpose vers l'aigu perd
  // son cote gros tas et devient liquide et leger, ce qui colle a sa silhouette
  // gracile. Une couche de voix feminine tres aigue par-dessus donne le souffle
  // presque humain qu'on entend derriere.
  pseudomonas: {
    voix: 'etheree, liquide',
    punch:       [['slime', 'slime.1.ogg', 5], ['femaleRpg', 'Type 3/attack1.wav', 4, 25]],
    kick:        [['slime', 'slime.4.ogg', 6], ['femaleRpg', 'Type 3/attack2.wav', 5, 25]],
    superattack: [['slime', 'slime.8.ogg', 4], ['femaleRpg', 'Type 3/attack3.wav', 3, 35]],
    hurt:        [['femaleRpg', 'Type 3/damaged1.wav', 4]],
    ko:          [['femaleRpg', 'Type 3/damaged3.wav', 3]],
    victory:     [['femaleRpg', 'Type 3/healed3.wav',  4], ['slime', 'slime.2.ogg', 6, 40]],
    jump:        [['slime', 'slime.5.ogg', 7]],
    esquive:     [['slime', 'slime.3.ogg', 8]],
    nargue:      [['femaleRpg', 'Type 3/curse.wav', 5]],
  },

  // --- S. putrefaciens : la bete a quatre pattes ----------------------------
  // Le quadrupede est le seul a garder les grognements a peu pres a leur hauteur
  // d'origine : c'est un animal, pas un colosse ni une bestiole. Le gaz lui vaut
  // une couche de slime sur toutes ses attaques, discrete mais systematique.
  shewanella: {
    voix: 'bete a quatre pattes',
    punch:       [['monstres', 'monster.7.ogg',  -1], ['slime', 'slime.4.ogg',  2, 35]],
    kick:        [['monstres', 'monster.5.ogg',  -2], ['slime', 'slime.7.ogg',  1, 35]],
    superattack: [['monstres', 'monster.4.ogg',  -3], ['slime', 'slime.10.ogg', 0, 45]],
    hurt:        [['monstres', 'monster.9.ogg',  -1]],
    ko:          [['monstres', 'monster.2.ogg',  -3]],
    victory:     [['monstres', 'monster.6.ogg',  -2]],
    jump:        [['slime',    'slime.1.ogg',    -1]],
    esquive:     [['slime',    'slime.6.ogg',     1]],
    nargue:      [['monstres', 'monster.15.ogg', -2], ['slime', 'slime.9.ogg', 2, 50]],
  },

  // --- A. flavus : ni cri ni grognement, du bruissement sec ------------------
  // Une moisissure n'a pas de voix. Pousses tres haut - neuf a quatorze
  // demi-tons - les grognements perdent tout leur corps et ne laissent que le
  // souffle et le grain : ca crisse et ca bruisse comme de la poussiere de
  // spores, sans plus jamais evoquer un animal. Trois couches pour l'epaisseur.
  aspergillus: {
    voix: 'bruissement sec de spores',
    punch:       [['monstres', 'monster.3.ogg',  10], ['slime', 'slime.7.ogg', 12, 20], ['monstres', 'monster.8.ogg', 14, 40]],
    kick:        [['monstres', 'monster.14.ogg', 11], ['slime', 'slime.3.ogg', 13, 20], ['slime',    'slime.8.ogg',    9, 40]],
    superattack: [['monstres', 'monster.10.ogg',  9], ['monstres', 'monster.5.ogg', 12, 25], ['slime', 'slime.5.ogg', 14, 50]],
    hurt:        [['monstres', 'monster.9.ogg',  12], ['slime', 'slime.2.ogg', 10, 25]],
    ko:          [['monstres', 'monster.13.ogg', 10], ['monstres', 'monster.1.ogg', 13, 30]],
    victory:     [['monstres', 'monster.16.ogg', 11], ['slime', 'slime.4.ogg', 14, 30]],
    jump:        [['slime',    'slime.6.ogg',    13]],
    esquive:     [['slime',    'slime.10.ogg',   12]],
    nargue:      [['monstres', 'monster.12.ogg', 10], ['monstres', 'monster.7.ogg', 13, 35]],
  },
};

module.exports = { SOURCES, VOICES, EVENTS };
