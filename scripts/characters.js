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
//
// 3. POUR UNE ATTAQUE A DISTANCE, DECRIRE UN OBJET, PAS UNE AURA, ET DIRE
//    « VERS LA DROITE ». « forward and away » ne suffit pas : le generateur
//    centre l'effet sur le personnage et produit un halo. Les sprites regardent
//    vers l'est, donc l'avant est la DROITE DE L'IMAGE, et il faut l'ecrire
//    ainsi — « shooting horizontally to the right, reaching the right edge of
//    the frame ». Comparer ce qui a marche du premier coup (« hurling a single
//    glowing golden spore like a baseball pitch », « spewing a jet of toxin from
//    its mouth » : un projectile concret) et ce qui a echoue (« huge flame jet
//    blasting forward, glowing energy aura » : un halo bleu autour du perso).

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
      kick: 'a bearded microbiologist in a white lab coat and blue gloves holding a spray bottle at hip level in both hands, a narrow horizontal stream of blue liquid disinfectant shooting sideways to the RIGHT across the frame like a water gun and reaching the right edge, the liquid stream staying well clear of his body, no cloud or halo around him, braced firing stance seen from the side',
      taunt: 'confidently taunting the opponent, adjusting glasses with one finger and smirking, holding up a petri dish like a trophy, unimpressed by the challenger',
      victory: 'celebrating a win, raising a petri dish overhead with a huge proud smile, confident victorious pose, chest out',
      superattack: 'a bearded microbiologist in a white lab coat and blue gloves holding a lit Bunsen burner out at full arm extension to the RIGHT, one long orange and blue flame shooting sideways to the RIGHT from the nozzle like a blowtorch, the flame stretching horizontally to the right edge of the frame, no fire touching or surrounding his body, side view, braced stance',
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
      kick: 'a female microbiologist in a white lab coat with a brown bun and glasses, holding a spray bottle at hip level in both hands, a narrow horizontal stream of blue liquid disinfectant shooting sideways to the RIGHT across the frame like a water gun and reaching the right edge, the liquid stream staying well clear of her body, no cloud or halo around her, braced firing stance seen from the side',
      taunt: 'confidently taunting the opponent, twirling an inoculation loop and smirking, beckoning the challenger with one hand',
      victory: 'celebrating a win, both fists raised high with a huge proud smile, confident victorious pose',
      superattack: 'a female microbiologist in a white lab coat with a brown bun and glasses holding a lit Bunsen burner out at full arm extension to the RIGHT, one long orange and blue flame shooting sideways to the RIGHT from the nozzle like a blowtorch, the flame stretching horizontally to the right edge of the frame, no fire touching or surrounding her body, side view, braced stance',
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
      superattack: 'a purple rod-shaped Listeria with glowing red eyes and green flagella, breathing out a cone of pale blue ice shards and frost that shoots sideways to the RIGHT across the frame and reaches the right edge, the frost staying well clear of its body, no ice covering or surrounding it, its purple body and grinning face fully visible, side view, braced stance',
      ...COMMON,
    },
  },

  // --- S. aureus : une grappe de coques, donc PLUSIEURS -------------------
  // Le trait a tenir coute que coute : le corps est fait de spheres dorees et
  // CHACUNE porte son propre petit visage, avec une expression differente. Une
  // coque plus grosse fait le torse. C'est ce qui le distingue d'un blob dore
  // quelconque, et c'est ce qui justifie sa voix composee de plusieurs voix.
  staph: {
    label: 'S. aureus — Staphylococcus aureus',
    reference: 'Staphylococcus aureus',
    // Décrit d'après l'image de référence fournie.
    description:
      'a cartoon humanoid made entirely of clustered golden-amber spheres like a bunch of grapes, ' +
      'each individual sphere having its own tiny face with a different expression, one larger ' +
      'sphere with an angry face forming the chest, clawed hands and feet made of smaller spheres, ' +
      'wide menacing stance, no skin and no clothing, only spheres',
    anims: {
      walk: 'a humanoid made of clustered golden spheres each with its own tiny face, walking forward with a heavy rolling stride, the spheres jostling against each other, the big angry face on its chest fully visible',
      jump: 'a humanoid made of clustered golden spheres each with its own tiny face, hovering in mid-air after a jump, the cluster loosening slightly, clawed sphere hands spread for balance',
      crouch: 'a humanoid made of clustered golden spheres each with its own tiny face, crouching low and compacting its cluster into a dense ball, subtle breathing bob',
      punch: 'a humanoid made of clustered golden spheres each with its own tiny face, throwing a heavy forward punch with a clawed sphere fist, full arm extension, dramatic street fighter style, the chest face snarling, the cluster twisting into the blow',
      kick: 'a humanoid made of clustered golden spheres each with its own tiny face, standing in the LEFT half of the frame with its whole golden body clearly visible and unobscured, flicking a SMALL compact cube of translucent yellow plasma, no bigger than its own head, out of its open clawed hand toward the RIGHT at chest height, the little cube floating alone in the empty right half of the frame with a short thin trail behind it, braced firing stance, side view',
      hurt: 'a humanoid made of clustered golden spheres each with its own tiny face, flinching backward after being hit, several spheres knocked loose and flying off, the little faces wincing in pain',
      ko: 'a humanoid made of clustered golden spheres each with its own tiny face, collapsing into a loose heap of scattered golden spheres on the ground, defeated, the little faces with closed eyes, dizzy stars overhead',
      taunt: 'a humanoid made of clustered golden spheres each with its own tiny face, taunting the opponent, all the little faces grinning and sneering at once, beckoning with a clawed sphere hand',
      victory: 'a humanoid made of clustered golden spheres each with its own tiny face, celebrating a win, both clawed sphere arms raised high, every little face cheering at once, the chest face triumphant',
      superattack: 'a humanoid made of clustered golden spheres each with its own tiny face, standing in the LEFT half of the frame with its golden spheres keeping their full amber colour and every tiny face still readable, its chest face open and spitting a NARROW horizontal stream of glowing amber toxin, no thicker than its own arm, toward the RIGHT at chest height through the empty right half of the frame, the stream starting clear of its body and never covering it, dramatic braced power pose, side view',
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
