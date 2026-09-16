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

  salmonella: {
    label: 'Salmonella — Salmonella enterica',
    reference: 'Salmonella enterica',
    // Décrit d'après l'image de référence fournie.
    description:
      'a cartoon humanoid rod-shaped bacterium, smooth pink capsule body with rounded ends, ' +
      'a dark almost black oval core in the middle of its chest, short bristly pili covering the whole body, ' +
      'six long segmented metallic grey tentacles like mechanical octopus arms sprouting from all over its ' +
      'body and curling around it, one tentacle tipped with a syringe needle, smirking menacing face, wide stance',
    anims: {
      walk: 'a pink rod-shaped bacterium humanoid with a dark core in its chest, walking forward carried by its six long segmented metallic tentacles that plant themselves on the ground one after another, body swaying slightly above them',
      jump: 'a pink rod-shaped bacterium humanoid with a dark core in its chest, launched in mid-air, its six long metallic tentacles splayed wide around it like a spider, body held upright',
      crouch: 'a pink rod-shaped bacterium humanoid with a dark core in its chest, crouching low and folding its six metallic tentacles tight against its body, coiled and ready to spring',
      punch: 'a pink rod-shaped bacterium humanoid with a dark core in its chest, whipping one long segmented metallic tentacle forward to the RIGHT like a striking snake, the tentacle straightening to full length, the other tentacles braced behind it, dramatic street fighter style',
      kick: 'a pink rod-shaped bacterium humanoid with a dark core in its chest, lunging forward to the RIGHT propelled by its six metallic tentacles pushing off the ground behind it, body streamlined and leaning into the charge, tentacles trailing back, a burst of speed lines behind it',
      taunt: 'a pink rod-shaped bacterium humanoid with a dark core in its chest, taunting the opponent, its metallic tentacles rising and waving lazily above it, smirking with half-lidded arrogant eyes',
      victory: 'a pink rod-shaped bacterium humanoid with a dark core in its chest, celebrating a win, all six metallic tentacles raised high and spread in a triumphant fan, grinning widely',
      superattack: 'a pink rod-shaped bacterium humanoid with a dark core in its chest, standing in the LEFT half of the frame with its whole pink body clearly visible, holding one metallic tentacle out straight to the RIGHT at chest height with a SMALL syringe needle at its tip, a single thin jet of pale fluid squirting from the needle toward the RIGHT through the empty right half of the frame, the jet no thicker than the needle and never touching its body, side view, braced stance',
      ...COMMON,
    },
  },

  botulinum: {
    label: 'C. botulinum — Clostridium botulinum',
    reference: 'Clostridium botulinum',
    // Décrit d'après l'image de référence fournie.
    description:
      'a cartoon humanoid rod-shaped bacterium, dull greyish-white body with taut cracked skin, ' +
      'an enormous pearly iridescent sphere bulging out of its belly and distending its body sideways, ' +
      'heavy drooping eyelids and a slack mouth, limp dangling hands, slow and swollen, ' +
      'looking bloated and under pressure',
    anims: {
      walk: 'a greyish-white rod-shaped bacterium humanoid with a huge pearly sphere bulging from its belly, shuffling forward slowly and heavily, dragging its feet, arms hanging limp at its sides, the bulging sphere swaying with each step',
      jump: 'a greyish-white rod-shaped bacterium humanoid with a huge pearly sphere bulging from its belly, heaved barely off the ground in a sluggish hop, limbs dangling loosely, the heavy sphere pulling it down',
      crouch: 'a greyish-white rod-shaped bacterium humanoid with a huge pearly sphere bulging from its belly, sinking down into a crouch, its swollen body compressing, head lolling forward',
      punch: 'a greyish-white rod-shaped bacterium humanoid with a huge pearly sphere bulging from its belly, throwing a slow heavy forward punch to the RIGHT with a limp loose fist, arm extending fully, drooping eyelids, dramatic street fighter style',
      kick: 'a greyish-white rod-shaped bacterium humanoid with a huge pearly sphere bulging from its belly, its swollen body suddenly distending and bursting outward with a short puff of pale gas around its waist, shoving forward to the RIGHT with both limp arms, cracked skin splitting',
      taunt: 'a greyish-white rod-shaped bacterium humanoid with a huge pearly sphere bulging from its belly, taunting the opponent with a slow lazy shrug, both hands hanging slack, eyelids drooping, utterly unbothered',
      victory: 'a greyish-white rod-shaped bacterium humanoid with a huge pearly sphere bulging from its belly, celebrating a win with a slow heavy raise of both limp arms, the pearly sphere gleaming, a faint satisfied sag to its face',
      superattack: 'a greyish-white rod-shaped bacterium humanoid with a huge pearly sphere bulging from its belly, standing in the LEFT half of the frame with its whole grey body clearly visible, both palms open and pushing toward the RIGHT, three or four THIN translucent nerve-like threads stretching horizontally from its palms to the RIGHT through the empty right half of the frame, the threads limp and drooping like cut puppet strings, nothing glowing around its body, side view',
      ...COMMON,
    },
  },

  pseudomonas: {
    label: 'P. fluorescens — Pseudomonas fluorescens',
    reference: 'Pseudomonas fluorescens',
    // Décrit d'après l'image de référence fournie.
    description:
      'a cartoon humanoid rod-shaped bacterium, slender translucent body in glowing yellow-green chartreuse, ' +
      'lit from inside with the brightest glow at the centre of its torso, a tuft of three long soft glowing ' +
      'flagella sprouting from ONE end only at the back of its head and trailing behind like a ponytail, ' +
      'thick glistening slime dripping off its body, calm serene face with pale glowing eyes, graceful silhouette',
    anims: {
      walk: 'a glowing chartreuse translucent rod-shaped bacterium humanoid, gliding forward smoothly, the tuft of long glowing flagella at the back of its head streaming behind it, slime dripping from its body, inner glow pulsing',
      jump: 'a glowing chartreuse translucent rod-shaped bacterium humanoid, suspended in mid-air, its tuft of long glowing flagella fanning out behind it, body arched gracefully, slime droplets floating around it',
      crouch: 'a glowing chartreuse translucent rod-shaped bacterium humanoid, folding down into a low crouch, its glowing flagella curling around it, inner glow dimming',
      punch: 'a glowing chartreuse translucent rod-shaped bacterium humanoid, striking forward to the RIGHT with one slender glowing arm at full extension, slime flicking off its fist, its inner glow flaring bright at the moment of impact, dramatic street fighter style',
      kick: 'a glowing chartreuse translucent rod-shaped bacterium humanoid, standing in the LEFT half of the frame with its whole glowing body clearly visible, flicking a SMALL compact ball of luminous yellow-green slime, no bigger than its own head, from its open hand toward the RIGHT at chest height, the little ball flying alone through the empty right half of the frame with a short dripping trail, side view',
      taunt: 'a glowing chartreuse translucent rod-shaped bacterium humanoid, taunting the opponent with a slow graceful beckoning gesture, its flagella swirling elegantly, inner glow brightening, serene superior expression',
      victory: 'a glowing chartreuse translucent rod-shaped bacterium humanoid, celebrating a win, arms spread wide and head tilted back, its inner glow blazing at full brightness, flagella fanned out behind it like a halo',
      superattack: 'a glowing chartreuse translucent rod-shaped bacterium humanoid, standing in the LEFT half of the frame with its whole glowing body clearly visible and its colour unchanged, both hands thrust toward the RIGHT, a NARROW horizontal stream of thick luminous yellow-green enzyme fluid, no thicker than its own arm, shooting toward the RIGHT at chest height through the empty right half of the frame, the stream starting clear of its body, side view, braced stance',
      ...COMMON,
    },
  },

  shewanella: {
    label: 'S. putrefaciens — Shewanella putrefaciens',
    reference: 'Shewanella putrefasciens',
    // Décrit d'après l'image de référence fournie : c'est un QUADRUPÈDE, d'où
    // le template "cat" plutôt que "mannequin" (voir `template` ci-dessous).
    template: 'cat',
    description:
      'a cartoon four-legged creature walking on all fours, hunched arched back, rust-brown metallic skin ' +
      'with oily iridescent green and violet sheen, its hands and feet blackened as if mineralised into ' +
      'charcoal black, a single long thin whip-like tail curling behind it, a drooping heavy head with ' +
      'sad half-lidded eyes hanging low between its shoulders, vents along its back leaking olive-green gas',
    anims: {
      walk: 'a rust-brown four-legged creature with blackened hands and feet and a long thin tail, prowling forward on all fours with a low dragging gait, head hanging low, olive-green gas leaking from the vents along its back',
      jump: 'a rust-brown four-legged creature with blackened hands and feet and a long thin tail, pouncing through the air on all fours, legs tucked under its body, tail streaming behind, gas trailing from its back',
      crouch: 'a rust-brown four-legged creature with blackened hands and feet and a long thin tail, flattening itself low against the ground on all fours, shoulders hunched high, head pressed down, ready to pounce',
      punch: 'a rust-brown four-legged creature with blackened hands and feet and a long thin tail, rearing up slightly and swiping forward to the RIGHT with one blackened front paw at full extension, the other three limbs braced on the ground, snarling',
      kick: 'a THICK JET OF OLIVE-GREEN GAS blasting horizontally to the RIGHT at knee height across the empty right half of the frame, sprayed from the back vents of a rust-brown four-legged creature with blackened hands and feet and a long thin tail, the creature standing on all fours in the LEFT half of the frame with its whole rust-brown body clearly visible and no gas on top of it, side view',
      taunt: 'a rust-brown four-legged creature with blackened hands and feet and a long thin tail, arching its back high on all fours and shaking itself, releasing a lazy puff of olive-green gas from its back vents, head turned to sneer at the opponent',
      victory: 'a rust-brown four-legged creature with blackened hands and feet and a long thin tail, standing tall on all fours with its back arched and head raised for the first time, tail held high, gas billowing proudly from its back vents',
      superattack: 'a DENSE ROLLING CLOUD OF DARK OLIVE-GREEN GAS billowing horizontally to the RIGHT along the ground, filling the empty right half of the frame and reaching the right edge, vomited from the open mouth of a rust-brown four-legged creature with blackened hands and feet and a long thin tail, the creature standing on all fours in the LEFT half of the frame with its head lowered toward the RIGHT and its whole rust-brown body clearly visible outside the cloud, the heavy gas sinking and spreading low instead of rising, side view',
      ...COMMON,
    },
  },

  aspergillus: {
    label: 'A. flavus — Aspergillus flavus',
    reference: 'Aspergillus flavus',
    // Décrit d'après l'image de référence fournie.
    description:
      'a cartoon humanoid creature whose whole body is braided from yellow-olive filaments twisted into ' +
      'limbs and torso, with a faint cold blue glow seeping from between the filaments, dark brown hard ' +
      'nodules under the skin of its arms and chest, pale bony hands and feet, and in place of a head a ' +
      'single thick rough stalk rising from its shoulders and opening into a perfect spiky sphere covered ' +
      'all over in radiating spore chains like a sea urchin, two dark sunken eyes set in the sphere',
    anims: {
      walk: 'a humanoid creature of braided yellow-olive filaments with a spiky spore-covered sphere for a head, stalking forward hunched, pale bony hands swinging low, a trail of fine yellow spore dust shaking loose from its head sphere with each step',
      jump: 'a humanoid creature of braided yellow-olive filaments with a spiky spore-covered sphere for a head, leaping through the air, filament limbs stretched out, a cloud of yellow spore dust bursting from its head sphere',
      crouch: 'a humanoid creature of braided yellow-olive filaments with a spiky spore-covered sphere for a head, crouching low and compacting its filaments, its head sphere tucked down between its shoulders',
      punch: 'a humanoid creature of braided yellow-olive filaments with a spiky spore-covered sphere for a head, driving a pale bony fist forward to the RIGHT at full arm extension, the filaments of its arm twisting tight like rope, dramatic street fighter style',
      kick: 'a humanoid creature of braided yellow-olive filaments with a spiky spore-covered sphere for a head, shaking its head sphere violently to fling a THICK short burst of yellow spore dust forward to the RIGHT at head height, the dust cloud compact and staying in front of it, its filament body fully visible and untouched, side view',
      taunt: 'a humanoid creature of braided yellow-olive filaments with a spiky spore-covered sphere for a head, tilting its head sphere slowly to one side and spreading its pale bony hands, the blue glow between its filaments pulsing brighter, silently mocking',
      victory: 'a humanoid creature of braided yellow-olive filaments with a spiky spore-covered sphere for a head, celebrating a win, both filament arms raised high, its head sphere releasing a slow rising halo of golden spore dust, the blue glow blazing between its filaments',
      superattack: 'a humanoid creature of braided yellow-olive filaments with a spiky spore-covered sphere for a head, standing in the LEFT half of the frame with its whole yellow-olive filament body clearly visible, one pale bony hand thrust toward the RIGHT, a NARROW horizontal beam of cold blue light, no thicker than its own arm, lancing from its palm toward the RIGHT at chest height through the empty right half of the frame, the beam starting clear of its body, side view, braced stance',
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
