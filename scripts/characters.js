// Définition des personnages côté génération : description physique (pour créer
// le personnage sur Pixellab) et description de chaque action (pour générer les
// animations). C'est le seul fichier à éditer pour changer l'allure d'un perso
// ou le ressenti d'un coup.
//
// Les descriptions sont en anglais : c'est la langue attendue par l'API Pixellab.
// Le reste du projet (interface, noms, commentaires) est en français.
//
// Conseil tiré de l'expérience : à 128 px puis réduit à ~110 px de haut à
// l'écran, tout petit détail disparaît. On décrit des FORMES et des COULEURS
// (« un badge rectangulaire teal »), jamais du texte ni un logo précis.

// Deux actions se jouent pareil pour tout le monde.
const COMMON = {
  hurt: 'flinching and staggering backward after being hit, pained expression',
  ko: 'getting knocked out and collapsing flat onto the ground, defeated, lying on the floor, dizzy stars spinning overhead',
};

const CHARACTERS = {
  gram: {
    label: 'Doc Gram — microbiologiste',
    // Décrit d'après la photo de référence fournie (references/gram.*).
    description:
      'a male microbiologist fighter, tall and lean, open white lab coat over a blue denim collared shirt, ' +
      'short swept-back auburn hair, full auburn beard and moustache, thin-framed glasses, ' +
      'blue nitrile gloves on both hands, a small teal rectangular badge on the chest pocket, ' +
      'dark olive trousers, beige sneakers, confident and focused, ready for an arcade duel',
    anims: {
      walk: 'walking forward calmly in a lab coat with a steady confident stride',
      jump: 'hovering in mid-air after jumping, lab coat flaring open, arms out for balance',
      crouch: 'crouching low into a defensive stance, one knee down, subtle breathing bob',
      punch: 'thrusting a micropipette forward like a rapier in a powerful lunging attack, full arm extension, dramatic street fighter style, ejecting a jet of blue reagent, strong body lean, intense focused expression',
      kick: 'throwing an extremely powerful high forward kick, full leg extension, lab coat whirling, dramatic street fighter style attack, exaggerated aggressive pose',
      taunt: 'confidently taunting the opponent, adjusting glasses with one finger and smirking, holding up a petri dish like a trophy, unimpressed by the challenger',
      victory: 'celebrating a win, raising a petri dish overhead with a huge proud smile, confident victorious pose, chest out',
      superattack: 'unleashing a devastating special attack with a roaring Bunsen burner blowtorch held in both hands, huge blue and orange flame jet blasting forward, dramatic anime power pose, glowing energy aura',
      ...COMMON,
    },
  },

  petri: {
    label: 'Doc Pétri — microbiologiste',
    description:
      'a female microbiologist fighter, athletic, open white lab coat over a teal top, hair tied back, ' +
      'safety glasses, green nitrile gloves on both hands, a small teal rectangular badge on the chest pocket, ' +
      'dark trousers, white lab clogs, determined and quick, ready for an arcade duel',
    anims: {
      walk: 'walking forward briskly in a lab coat with a light determined stride',
      jump: 'hovering in mid-air after jumping, lab coat flaring open, arms out for balance',
      crouch: 'crouching low into a defensive stance, one knee down, subtle breathing bob',
      punch: 'smashing forward with a heavy test tube rack swung like a club, powerful lunging attack, full arm extension, dramatic street fighter style, glass tubes rattling, strong body lean',
      kick: 'throwing an extremely powerful high forward kick, full leg extension, lab coat whirling, dramatic street fighter style attack, exaggerated aggressive pose',
      taunt: 'confidently taunting the opponent, twirling an inoculation loop and smirking, beckoning the challenger with one hand',
      victory: 'celebrating a win, both fists raised high with a huge proud smile, confident victorious pose',
      superattack: 'unleashing a devastating special attack, hurling a blast of scalding autoclave steam forward with both arms, enormous white pressurized steam jet, dramatic anime power pose, glowing energy aura',
      ...COMMON,
    },
  },

  staphy: {
    label: 'Staphy — staphylocoque doré',
    description:
      'a cartoon golden staphylococcus bacterium fighter, body made of a cluster of round golden cocci ' +
      'stuck together like a bunch of grapes, stubby muscular arms and legs, angry eyebrows, ' +
      'big grin with sharp teeth, heavy brawler build',
    anims: {
      walk: 'lumbering forward heavily, golden cocci cluster body wobbling with each slow step',
      jump: 'hovering in mid-air after a heavy jump, round cluster body squashed, stubby arms out',
      crouch: 'squashing down low into a compact defensive ball, subtle breathing bob',
      punch: 'throwing an extremely powerful heavy forward haymaker punch, full arm extension, dramatic street fighter style attack, exaggerated aggressive pose, golden cluster body twisting into the blow, furious expression',
      kick: 'throwing an extremely powerful heavy forward stomping kick, full leg extension, dramatic street fighter style attack, exaggerated aggressive pose',
      taunt: 'cockily taunting the opponent, flexing its round golden cluster body and sneering, daring the challenger to come closer',
      victory: 'celebrating a win, bouncing with both stubby arms raised, huge gloating grin, confident victorious pose',
      superattack: 'unleashing a devastating special attack, spraying a thick burst of golden toxin bubbles forward from its whole cluster body, dramatic anime power pose, glowing energy aura',
      ...COMMON,
    },
  },

  coli: {
    label: 'Coli — bacille flagellé',
    description:
      'a cartoon rod-shaped bacillus bacterium fighter, cyan capsule body, several long whipping flagella ' +
      'at the back, thin nimble arms and legs, cheeky mischievous eyes, small fast and agile build',
    anims: {
      walk: 'darting forward quickly, rod-shaped body leaning into the run, flagella whipping behind',
      jump: 'hovering in mid-air after a high jump, rod body arched, flagella trailing',
      crouch: 'crouching low and coiled like a spring, ready to dash, subtle breathing bob',
      punch: 'throwing a lightning fast forward jab, full arm extension, dramatic street fighter style attack, speed lines, rod body stretched into the blow, cheeky expression',
      kick: 'throwing a fast spinning forward kick, full leg extension, flagella whirling, dramatic street fighter style attack, exaggerated aggressive pose',
      taunt: 'cheekily taunting the opponent, spinning its flagella like a propeller and sticking out its tongue, wiggling mockingly',
      victory: 'celebrating a win, spinning happily in place with flagella twirling, huge cheerful grin, victorious pose',
      superattack: 'unleashing a devastating special attack, rocketing forward as a spinning drill propelled by its flagella, huge motion blur trail, dramatic anime power pose, glowing energy aura',
      ...COMMON,
    },
  },
};

// Pour les coups, on garde la frame de départ (pose neutre) comme frame 0 : le
// coup part visuellement de la garde, ce qui rend les 5 frames lisibles.
const KEEP_FIRST_FRAME = new Set(['punch', 'kick', 'hurt', 'ko', 'taunt', 'victory', 'superattack']);

// L'ordre dans lequel generate-sprites.js les génère par défaut.
const ANIMATION_ORDER = [
  'walk', 'jump', 'crouch', 'punch', 'kick', 'hurt', 'ko', 'taunt', 'victory', 'superattack',
];

module.exports = { CHARACTERS, KEEP_FIRST_FRAME, ANIMATION_ORDER };
