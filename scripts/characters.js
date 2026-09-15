// Définition des personnages côté génération : description physique (pour créer
// le personnage sur Pixellab) et description de chaque action (pour générer les
// animations). C'est le seul fichier à éditer pour changer l'allure d'un perso
// ou le ressenti d'un coup.
//
// Les descriptions sont en anglais : c'est la langue attendue par l'API Pixellab.
// Le reste du projet (interface, noms, commentaires) est en français.
//
// DEUX RÈGLES, apprises en regardant les 44 premières animations générées.
//
// 1. Décrire des FORMES et des COULEURS, jamais du texte ni un logo. À 128 px
//    puis réduit à une centaine de pixels de haut, un badge marqué « ADRIA »
//    devient trois pixels de bouillie ; « un badge rectangulaire teal » rend
//    bien. À l'inverse, un trait de silhouette survit très bien et mérite
//    d'être nommé : le spore abdominal, les flagelles, un rictus.
//
// 2. RÉANCRER L'IDENTITÉ DANS CHAQUE ACTION. Une description qui ne nomme que
//    le mouvement ou l'effet laisse le générateur repeindre le personnage :
//    « enormous white steam jet » a produit une silhouette entièrement en
//    vapeur, cheveux compris. Les descriptions de B. cereus rappellent son
//    corps vert et son spore à chaque action — il est le seul des quatre à
//    n'avoir aucune frame ratée sur onze.
//    Pour une attaque spectaculaire, dire aussi que l'effet part VERS L'AVANT,
//    loin du personnage, et que le corps reste visible.

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
      kick: 'a bearded microbiologist in a white lab coat and blue gloves spraying a pressurised jet of blue biocide from a spray bottle held in both hands, the blue mist blasting forward and away from him, his body and white coat fully visible, braced firing stance',
      taunt: 'confidently taunting the opponent, adjusting glasses with one finger and smirking, holding up a petri dish like a trophy, unimpressed by the challenger',
      victory: 'celebrating a win, raising a petri dish overhead with a huge proud smile, confident victorious pose, chest out',
      superattack: 'a bearded microbiologist in a white lab coat and blue gloves gripping a roaring Bunsen burner blowtorch in both hands, the blue and orange flame jet blasting forward and away from him, his body and white coat fully visible and never hidden by the flame, dramatic braced power stance',
      ...COMMON,
    },
  },

  petri: {
    label: 'Doc Pétri — microbiologiste',
    // Décrite d'après l'image de référence fournie (references/petri.jpg).
    description:
      'a female microbiologist fighter, athletic, open white lab coat over a blue denim collared shirt, ' +
      'brown hair tied back in a high bun, thin-framed glasses, blue nitrile gloves on both hands, ' +
      'a small teal rectangular badge on the chest pocket, dark olive trousers, beige sneakers, ' +
      'determined and quick, ready for an arcade duel',
    anims: {
      walk: 'walking forward briskly in a lab coat with a light determined stride',
      jump: 'hovering in mid-air after jumping, lab coat flaring open, arms out for balance',
      crouch: 'crouching low into a defensive stance, one knee down, subtle breathing bob',
      punch: 'a female microbiologist in a white lab coat, brown hair in a high bun and glasses, smashing a heavy metal test tube rack forward like a club, full arm extension, white coat flaring open, dramatic street fighter style lunging attack, glass tubes rattling',
      kick: 'a female microbiologist in a white lab coat, brown hair in a high bun and glasses, spraying a pressurised jet of blue biocide from a spray bottle held in both hands, the blue mist blasting forward and away from her, her body and white coat fully visible, braced firing stance',
      taunt: 'confidently taunting the opponent, twirling an inoculation loop and smirking, beckoning the challenger with one hand',
      victory: 'celebrating a win, both fists raised high with a huge proud smile, confident victorious pose',
      superattack: 'a female microbiologist in a white lab coat, brown hair in a high bun and glasses, thrusting both blue-gloved hands forward as a jet of white autoclave steam blasts forward and away from her, her body and coat fully visible and never hidden by the steam, dramatic braced power stance',
      ...COMMON,
    },
  },

  cereus: {
    label: 'B. cereus — Bacillus cereus',
    // Décrit d'après l'image de référence fournie (references/cereus.jpg).
    // La spore dans l'abdomen est le trait à préserver coûte que coûte : c'est
    // ce qui rend le perso identifiable comme un Bacillus et pas un bacille
    // quelconque. Elle est décrite dans chaque action pour survivre aux frames.
    description:
      'a cartoon green rod-shaped Bacillus bacterium fighter, muscular humanoid arms and legs, ' +
      'bulging white cartoon eyes and a lolling tongue, many long curling green flagella all around ' +
      'the body, and a large oval endospore embedded in its belly with angry yellow glaring eyes, ' +
      'heavy bulky brawler build',
    anims: {
      walk: 'lumbering forward heavily, bulky green rod body swaying, flagella dragging behind, belly endospore glowing',
      jump: 'hovering in mid-air after a heavy jump, green rod body squashed, flagella splayed out, arms out for balance',
      crouch: 'crouching low into a compact defensive stance, green body hunched over its belly endospore, subtle breathing bob',
      punch: 'throwing an extremely powerful heavy forward haymaker punch, full arm extension, dramatic street fighter style attack, exaggerated aggressive pose, green rod body twisting into the blow, furious expression',
      kick: 'a green rod-shaped Bacillus with flagella and a belly endospore, hurling a single glowing golden spore forward with one arm like a baseball pitch, the spore leaving a bright trail away from its body, its green body and belly endospore fully visible, wide throwing stance',
      taunt: 'cockily taunting the opponent, flexing both muscular green arms and sneering, belly endospore glaring at the challenger',
      victory: 'celebrating a win, both muscular green arms raised high, huge gloating grin with lolling tongue, victorious pose',
      superattack: 'a green rod-shaped Bacillus with flagella, its belly endospore blazing, spewing a thick jet of sickly yellow-green cereulide toxin forward from its mouth, the toxin stream blasting forward and away from it, its green body fully visible, dramatic braced power pose',
      ...COMMON,
    },
  },

  listeria: {
    label: 'L. monocytogenes — Listeria monocytogenes',
    // Décrite d'après l'image de référence fournie (references/listeria.jpg).
    description:
      'a cartoon purple rod-shaped Listeria bacterium fighter, lean muscular humanoid arms and legs, ' +
      'glowing red eyes and a wide jagged grin full of sharp teeth, many long curling green flagella ' +
      'all around the body, sleek and vicious build',
    anims: {
      walk: 'a purple rod-shaped Listeria with red eyes and green flagella, WALKING forward on its two legs, a clear side-view walk cycle with legs alternating step after step, body upright and leaning slightly into the stride, flagella trailing behind',
      jump: 'hovering in mid-air after a high jump, purple rod body arched, flagella trailing, claws spread',
      crouch: 'crouching low and coiled like a predator ready to pounce, subtle breathing bob, red eyes glaring',
      punch: 'throwing a fast vicious forward claw strike, full arm extension, dramatic street fighter style attack, speed lines, purple body lunging, savage grin',
      kick: 'a purple rod-shaped Listeria with glowing red eyes and green flagella, crouching and wrapping itself in a thick translucent slime biofilm dome that forms around its body like a shield, arms drawn in defensively, its purple body and red eyes still visible through the slime, defensive stance',
      taunt: 'menacingly taunting the opponent, beckoning with one clawed hand and grinning wide with sharp teeth, red eyes burning',
      victory: 'celebrating a win, throwing its head back with a triumphant roar, arms spread wide, red eyes blazing, victorious pose',
      superattack: 'a purple rod-shaped Listeria with glowing red eyes, a jagged toothy grin and green flagella, thrusting both clawed hands forward as a blast of pale blue freezing frost and ice shards shoots forward and away from it, its purple body and grinning face fully visible and never hidden by the frost, dramatic braced power pose',
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
