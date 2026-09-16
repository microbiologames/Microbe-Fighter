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
    // Le pack contient trois voix féminines (Type 1 à 3), toutes utilisables.
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
};

module.exports = { SOURCES, VOICES, EVENTS };
