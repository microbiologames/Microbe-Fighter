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
//
// 4. NOMMER UN OBJET QUE N'IMPORTE QUI SAURAIT DESSINER. C'est la regle qui a
//    manque a la premiere fournee de microbiologistes, et elle a coute cher.
//    Un generateur ne sait pas dessiner un CONCEPT : il rend une forme molle.
//
//      « a capsule of DNA »                 -> une gelule bleue quelconque
//      « geometric symbols and a curve »    -> une baguette de pain
//      « a ribbon of DNA strands »          -> un ruban vert sans structure
//
//    Il faut decrire la FORME, comme a quelqu'un qui doit la dessiner de tete :
//
//      « a DNA double helix, two strands twisted around each other with short
//        rungs between them, like a twisted rope ladder »
//      « four or five big clearly readable digits, a 3, a 7, a 5 and a 9, each
//        one separate and as tall as his hand »
//      « a capsule-shaped creature with two round eyes, shaped like a grain of
//        rice »
//
//    Les CHIFFRES sont la seule entorse admise a la regle 1, qui interdit le
//    texte : un chiffre isole et gros survit a la reduction, un mot non. Ils
//    doivent rester peu nombreux et grands.
//
//    Corollaire : mieux vaut SIMPLE ET JUSTE que riche et approximatif.
//
//    Et surtout : LE GENERATEUR NE COMPTE PAS. « THREE small helices flying one
//    behind the other » a donne trois vaguelettes informes flottant pres de la
//    tete du personnage. UN SEUL objet, decrit en detail et dit plus gros, sort
//    net. Sur la meme planche, le pied de K. Mullis — une seule helice — etait
//    parfait pendant que sa super attaque, qui en demandait trois, etait
//    illisible. A chaque fois qu'on est tente d'ecrire « trois » ou « quatre »,
//    ecrire « ONE LARGE » a la place.

// Deux actions se jouent pareil pour tout le monde.
const COMMON = {
  hurt: 'flinching and staggering backward after being hit, pained expression',
  ko: 'getting knocked out and collapsing flat onto the ground, defeated, lying on the floor, dizzy stars spinning overhead',
};

const CHARACTERS = {


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
      idle: 'a large green rod-shaped bacterium humanoid with a glowing spore in its belly, standing still in a heavy fighting stance, breathing slowly and deeply, its bulky green body swelling and settling with each breath, the abdominal spore pulsing faintly, fists loosely raised, waiting',
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
      idle: 'a lean pale bacterium humanoid with clawed hands, standing still in a low twitchy fighting stance, breathing quickly and shallowly, its slender body bobbing lightly, claws flexing open and closed, head tilting slightly, impatient and ready to dart',
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
    style: 'tall adult body proportions with long legs, not chibi and not a big-headed cartoon, but keeping its bulky grape-like cluster shape',
    label: 'S. aureus — Staphylococcus aureus',
    reference: 'Staphylococcus aureus',
    // Décrit d'après l'image de référence fournie.
    description:
      'a cartoon humanoid made entirely of clustered golden-amber spheres like a bunch of grapes, ' +
      'each individual sphere having its own tiny face with a different expression, one larger ' +
      'sphere with an angry face forming the chest, clawed hands and feet made of smaller spheres, ' +
      'wide menacing stance, no skin and no clothing, only spheres',
    anims: {
      idle: 'a humanoid made of clustered golden spheres each with its own tiny face, standing still in a braced fighting stance, the whole cluster breathing as one, the individual spheres jostling and rolling slightly against each other, the big angry face on its chest fully visible, the little faces blinking and shifting expression, waiting',
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
      idle: 'a pink rod-shaped bacterium humanoid with a dark core in its chest, standing still in an arrogant fighting stance, its pink body breathing slowly, its six long segmented metallic tentacles undulating and coiling lazily around it in the air, the syringe-tipped tentacle swaying, smirking and waiting',
      walk: 'a pink rod-shaped bacterium humanoid with a dark core in its chest, walking forward carried by its six long segmented metallic tentacles that plant themselves on the ground one after another, body swaying slightly above them',
      jump: 'a pink rod-shaped bacterium humanoid with a dark core in its chest, launched in mid-air, its six long metallic tentacles splayed wide around it like a spider, body held upright',
      crouch: 'a pink rod-shaped bacterium humanoid with a dark core in its chest, crouching low and folding its six metallic tentacles tight against its body, coiled and ready to spring',
      punch: 'a pink rod-shaped bacterium humanoid with a dark core in its chest, whipping one long segmented metallic tentacle forward to the RIGHT like a striking snake, the tentacle straightening to full length, the other tentacles braced behind it, dramatic street fighter style',
      kick: 'a pink rod-shaped bacterium humanoid with a dark core in its chest, lunging forward to the RIGHT propelled by its six metallic tentacles pushing off the ground behind it, body streamlined and leaning into the charge, tentacles trailing back, a burst of speed lines behind it',
      taunt: 'a pink rod-shaped bacterium humanoid with a dark core in its chest, taunting the opponent, its metallic tentacles rising and waving lazily above it, smirking with half-lidded arrogant eyes',
      victory: 'a pink rod-shaped bacterium humanoid with a dark core in its chest, celebrating a win, all six metallic tentacles raised high and spread in a triumphant fan, grinning widely',
      superattack: 'a pink rod-shaped bacterium humanoid with a dark core in its chest, standing in the LEFT half of the frame with its whole pink body clearly visible, holding ONE LARGE metallic syringe with a long sharp needle, the syringe as long as its own body, gripped by a metallic tentacle and pointed horizontally toward the RIGHT at chest height across the empty right half of the frame, the syringe clearly visible and completely clear of its body, side view, braced stance',
      ...COMMON,
    },
  },

  botulinum: {
    style: 'tall adult body proportions with long legs, not chibi and not a big-headed cartoon, but keeping its hugely swollen distended belly',
    label: 'C. botulinum — Clostridium botulinum',
    reference: 'Clostridium botulinum',
    // Décrit d'après l'image de référence fournie.
    description:
      'a cartoon humanoid rod-shaped bacterium, dull greyish-white body with taut cracked skin, ' +
      'an enormous pearly iridescent sphere bulging out of its belly and distending its body sideways, ' +
      'heavy drooping eyelids and a slack mouth, limp dangling hands, slow and swollen, ' +
      'looking bloated and under pressure',
    anims: {
      idle: 'a greyish-white rod-shaped bacterium humanoid with a huge pearly sphere bulging from its belly, standing still and swaying heavily, breathing slow and laboured, the enormous bulging sphere rising and sinking with each breath and pulling its body off balance, arms hanging limp, eyelids drooping, barely awake',
      walk: 'a greyish-white rod-shaped bacterium humanoid with a huge pearly sphere bulging from its belly, shuffling forward slowly and heavily, dragging its feet, arms hanging limp at its sides, the bulging sphere swaying with each step',
      jump: 'a greyish-white rod-shaped bacterium humanoid with a huge pearly sphere bulging from its belly, heaved barely off the ground in a sluggish hop, limbs dangling loosely, the heavy sphere pulling it down',
      crouch: 'a greyish-white rod-shaped bacterium humanoid with a huge pearly sphere bulging from its belly, sinking down into a crouch, its swollen body compressing, head lolling forward',
      punch: 'a greyish-white rod-shaped bacterium humanoid with a huge pearly sphere bulging from its belly, throwing a slow heavy forward punch to the RIGHT with a limp loose fist, arm extending fully, drooping eyelids, dramatic street fighter style',
      kick: 'a greyish-white rod-shaped bacterium humanoid with a huge pearly sphere bulging from its belly, its swollen body suddenly distending and bursting outward with a short puff of pale gas around its waist, shoving forward to the RIGHT with both limp arms, cracked skin splitting',
      taunt: 'a greyish-white rod-shaped bacterium humanoid with a huge pearly sphere bulging from its belly, taunting the opponent with a slow lazy shrug, both hands hanging slack, eyelids drooping, utterly unbothered',
      victory: 'a greyish-white rod-shaped bacterium humanoid with a huge pearly sphere bulging from its belly, celebrating a win with a slow heavy raise of both limp arms, the pearly sphere gleaming, a faint satisfied sag to its face',
      superattack: 'a greyish-white rod-shaped bacterium humanoid with a huge pearly sphere bulging from its belly, standing in the LEFT half of the frame with its whole grey body clearly visible, one palm open and pushing toward the RIGHT, ONE THICK limp translucent cord drooping from its palm and hanging toward the RIGHT across the empty right half of the frame, sagging in the middle like a cut puppet string, nothing else around its body, side view',
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
      idle: 'a glowing chartreuse translucent humanoid creature, standing still in a fighting stance, its slender glowing body swaying gently, its inner glow pulsing slowly brighter and dimmer like a heartbeat, the tuft of long glowing flagella at the back of its head drifting slowly behind it, slime dripping from its body, serene and waiting',
      walk: 'a glowing chartreuse translucent humanoid creature, striding forward on two legs, the tuft of long glowing flagella at the back of its head streaming behind it, slime dripping from its body, inner glow pulsing',
      jump: 'a glowing chartreuse translucent humanoid creature, suspended in mid-air, its tuft of long glowing flagella fanning out behind it, body arched gracefully, slime droplets floating around it',
      crouch: 'a glowing chartreuse translucent humanoid creature, folding down into a low crouch, its glowing flagella curling around it, inner glow dimming',
      punch: 'a glowing chartreuse translucent humanoid creature, striking forward to the RIGHT with one slender glowing arm at full extension, slime flicking off its fist, its inner glow flaring bright at the moment of impact, dramatic street fighter style',
      kick: 'a glowing chartreuse translucent humanoid creature, standing in the LEFT half of the frame with its whole glowing body clearly visible, flicking a SMALL compact ball of luminous yellow-green slime, no bigger than its own head, from its open hand toward the RIGHT at chest height, the little ball flying alone through the empty right half of the frame with a short dripping trail, side view',
      taunt: 'a glowing chartreuse translucent humanoid creature, taunting the opponent with a slow graceful beckoning gesture, its flagella swirling elegantly, inner glow brightening, serene superior expression',
      victory: 'a glowing chartreuse translucent humanoid creature, celebrating a win, arms spread wide and head tilted back, its inner glow blazing at full brightness, flagella fanned out behind it like a halo',
      superattack: 'a glowing chartreuse translucent humanoid creature, standing in the LEFT half of the frame with its whole glowing body clearly visible and its colour unchanged, both hands thrust toward the RIGHT, a NARROW horizontal stream of thick luminous yellow-green enzyme fluid, no thicker than its own arm, shooting toward the RIGHT at chest height through the empty right half of the frame, the stream starting clear of its body, side view, braced stance',
      ...COMMON,
    },
  },

  shewanella: {
    label: 'S. putrefaciens — Shewanella putrefaciens',
    reference: 'Shewanella putrefasciens',
    // La première image de référence était un quadrupède, d'où un `template:
    // 'cat'`. La seconde est bipède : on repasse sur `mannequin`, le template
    // par défaut. C'est un changement qui ne se rattrape pas après coup —
    // l'endpoint d'animation n'accepte pas de template, il hérite de celui du
    // personnage — donc il fallait le faire AVANT de recréer le personnage.
    description:
      'a lean bipedal humanoid creature whose rust-brown metallic skin is covered all over in ' +
      'large oily iridescent patches of green, teal and violet that catch the light, its hands ' +
      'and feet blackened as if charred to charcoal, thin dark cables and tubes running along ' +
      'its arms and legs, a long thin whip-like tail curling behind it, a smooth hairless head ' +
      'with narrow eyes, standing in a low fighting crouch',
    anims: {
      idle: 'a rust-brown humanoid creature with blackened hands and feet and a long thin tail, standing still in a low fighting crouch, breathing slowly and deeply, its long tail swaying lazily behind it, small puffs of olive-green gas escaping from vents on its back, shoulders hunched',
      walk: 'a rust-brown humanoid creature with blackened hands and feet and a long thin tail, stalking forward on two legs with a low prowling stride, shoulders rolling, tail sweeping behind it, wisps of olive-green gas trailing from its back',
      jump: 'a rust-brown humanoid creature with blackened hands and feet and a long thin tail, leaping through the air, legs tucked and arms spread for balance, tail streaming behind it, gas trailing from its back',
      crouch: 'a rust-brown humanoid creature with blackened hands and feet and a long thin tail, crouching low with one knee bent and both hands near the ground, tail flat behind it, coiled and ready to spring',
      punch: 'a rust-brown humanoid creature with blackened hands and feet and a long thin tail, driving a blackened clawed fist forward to the RIGHT at full arm extension, body twisting into the blow, tail whipping out behind for balance, snarling',
      kick: 'a THICK JET OF OLIVE-GREEN GAS blasting horizontally to the RIGHT at waist height across the empty right half of the frame, sprayed from the open mouth of a rust-brown humanoid creature with blackened hands and feet and a long thin tail, the creature standing on two legs in the LEFT half of the frame with its whole rust-brown body clearly visible and no gas on top of it, side view',
      taunt: 'a rust-brown humanoid creature with blackened hands and feet and a long thin tail, arching its back and spreading its arms wide, releasing a lazy puff of olive-green gas from its back vents, head tilted to sneer at the opponent',
      victory: 'a rust-brown humanoid creature with blackened hands and feet and a long thin tail, celebrating a win, both blackened fists raised high, head thrown back, tail held high, gas billowing proudly from its back vents',
      superattack: 'a DENSE ROLLING CLOUD OF DARK OLIVE-GREEN GAS billowing horizontally to the RIGHT along the ground, filling the empty right half of the frame and reaching the right edge, vomited from the open mouth of a rust-brown humanoid creature with blackened hands and feet and a long thin tail, the creature standing on two legs in the LEFT half of the frame, leaning forward with its head lowered toward the RIGHT and its whole body clearly visible outside the cloud, the heavy gas sinking and spreading low instead of rising, side view',
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
      idle: 'a humanoid creature of braided yellow-olive filaments with a spiky spore-covered sphere for a head, standing still, its braided filaments slowly writhing and tightening around its limbs, its head sphere turning almost imperceptibly, fine yellow spore dust drifting off the spore chains and falling around it, the cold blue glow between its filaments pulsing slowly, waiting',
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

  mullis: {
    label: 'Kary Mullis — inventeur de la PCR',
    reference: 'Kary Mullis',
    // Décrit d'après l'image de référence fournie.
    description:
      'a 70-year-old man, bald on top with short white hair at the sides and over the ears, ' +
      'clean-shaven, lean face with deep smile lines, alert eyes, wearing an open white lab coat ' +
      'over an orange and brown plaid shirt, a brown belt, beige trousers and brown shoes',
    anims: {
      idle: 'an elderly bald scientist in an open white lab coat over an orange plaid shirt, standing in a loose restless fighting stance, breathing quickly, shifting his weight impatiently from foot to foot, the hem of his lab coat swaying, one hand flexing',
      walk: 'an elderly bald scientist in an open white lab coat over an orange plaid shirt, striding forward quickly and eagerly, lab coat flapping behind him',
      jump: 'an elderly bald scientist in an open white lab coat over an orange plaid shirt, in mid-air after a jump, lab coat flaring open, arms out for balance',
      crouch: 'an elderly bald scientist in an open white lab coat over an orange plaid shirt, crouching low into a defensive stance, one knee bent, subtle breathing bob',
      punch: 'an elderly bald scientist in an open white lab coat over an orange plaid shirt, thrusting a micropipette forward to the RIGHT like a rapier at full arm extension, nothing coming out of it, dramatic street fighter style, sharp focused expression',
      kick: 'an elderly bald scientist in an open white lab coat over an orange plaid shirt, standing in the LEFT half of the frame with his whole body clearly visible, hurling ONE SMALL blue glowing a DNA DOUBLE HELIX — two strands twisted around each other with short rungs between them, like a twisted rope ladder, no longer than his forearm, flying alone through the empty right half of the frame toward the RIGHT at chest height, side view',
      taunt: 'an elderly bald scientist in an open white lab coat over an orange plaid shirt, taunting the opponent with a cocky grin, spinning a micropipette between his fingers, beckoning with his free hand',
      victory: 'an elderly bald scientist in an open white lab coat over an orange plaid shirt, celebrating a win, both arms thrown up in triumph, a huge delighted grin, a micropipette raised overhead',
      superattack: 'an elderly bald scientist in an open white lab coat over an orange plaid shirt, standing in the LEFT half of the frame with his whole body clearly visible, both hands pushed toward the RIGHT, ONE LARGE blue glowing DNA DOUBLE HELIX — two strands twisted around each other with clear rungs between them, like a twisted rope ladder — flying horizontally toward the RIGHT at chest height across the empty right half of the frame and reaching the right edge, clearly separate from his body, side view',
      ...COMMON,
    },
  },

  franklin: {
    label: 'Rosalind Franklin — structure de l ADN',
    reference: 'Rosalind Franklin',
    // Décrit d'après l'image de référence fournie.
    description:
      'a 35-year-old woman, tall and slim with realistic adult proportions and a small head, ' +
      'short dark brown curly hair with volume around her face, fair skin, a calm serious oval ' +
      'face, dark eyes, wearing a plain buttoned white lab coat with nothing on it, blue jeans ' +
      'and brown shoes',
    anims: {
      idle: 'a female scientist with short dark curly hair in a white lab coat and blue jeans, standing very still in a composed fighting stance, breathing slowly and evenly, her chest rising and falling, the hem of her lab coat barely moving, eyes steady and measuring',
      walk: 'a female scientist with short dark curly hair in a white lab coat and blue jeans, walking forward with a steady deliberate stride, lab coat swaying',
      jump: 'a female scientist with short dark curly hair in a white lab coat and blue jeans, in mid-air after a jump, lab coat flaring, arms out for balance',
      crouch: 'a female scientist with short dark curly hair in a white lab coat and blue jeans, crouching low into a defensive stance, one knee bent, subtle breathing bob',
      punch: 'a female scientist with short dark curly hair in a white lab coat and blue jeans, driving a precise straight punch forward to the RIGHT at full arm extension, body squared and balanced, dramatic street fighter style, intensely focused',
      kick: 'a female scientist with short dark curly hair in a white lab coat and blue jeans, standing in the LEFT half of the frame with her whole body clearly visible, launching ONE SMALL blue glowing a DNA DOUBLE HELIX — two strands twisted around each other with short rungs between them, like a twisted rope ladder, no longer than her forearm, flying alone through the empty right half of the frame toward the RIGHT at chest height, side view',
      taunt: 'a female scientist with short dark curly hair in a white lab coat and blue jeans, taunting the opponent with a cool raised eyebrow and a small dismissive gesture, holding up a dark photographic plate',
      victory: 'a female scientist with short dark curly hair in a white lab coat and blue jeans, celebrating a win, holding a dark photographic plate overhead in both hands, a quiet proud smile',
      superattack: 'a female scientist with short dark curly hair in a white lab coat and blue jeans, standing in the LEFT half of the frame with her whole body clearly visible, both hands pushed toward the RIGHT, ONE LONG blue glowing DNA double helix — two strands twisted around each other with clear rungs between them, like a twisted rope ladder — stretching horizontally toward the RIGHT at chest height across the empty right half of the frame, clear of her body, side view, braced stance',
      ...COMMON,
    },
  },

  baranyi: {
    label: 'József Baranyi — microbiologie previsionnelle',
    reference: 'József Baranyi',
    // Décrit d'après l'image de référence fournie.
    description:
      'a 70-year-old man, bald on top with grey hair at the sides, clean-shaven, round ' +
      'wire-rimmed glasses, a lined thoughtful face, wearing a long open white lab coat over a ' +
      'dark grey sweater, olive green trousers and brown shoes',
    anims: {
      idle: 'an elderly bald bespectacled scientist in a long white lab coat over a dark sweater, standing still in a calm fighting stance, breathing slowly, adjusting his glasses with one finger, the hem of his long lab coat swaying gently, watching and calculating',
      walk: 'an elderly bald bespectacled scientist in a long white lab coat over a dark sweater, walking forward at an unhurried measured pace, long lab coat swaying',
      jump: 'an elderly bald bespectacled scientist in a long white lab coat over a dark sweater, in mid-air after a jump, long lab coat flaring open, arms out for balance',
      crouch: 'an elderly bald bespectacled scientist in a long white lab coat over a dark sweater, crouching low into a defensive stance, one knee bent, subtle breathing bob',
      punch: 'an elderly bald bespectacled scientist in a long white lab coat over a dark sweater, jabbing a wooden ruler forward to the RIGHT at full arm extension like a fencing thrust, dramatic street fighter style, stern expression',
      kick: 'an elderly bald bespectacled scientist in a long white lab coat over a dark sweater, standing in the LEFT half of the frame with his whole body clearly visible, throwing a handful of GLOWING CYAN NUMBERS toward the RIGHT — four or five big clearly readable digits, a 3, a 7, a 5 and a 9, each one separate and as tall as his hand — scattering through the empty right half of the frame at chest height, side view',
      taunt: 'an elderly bald bespectacled scientist in a long white lab coat over a dark sweater, taunting the opponent by tapping his temple knowingly and giving a small superior smile, chalk in his other hand',
      victory: 'an elderly bald bespectacled scientist in a long white lab coat over a dark sweater, celebrating a win, raising a piece of chalk overhead, a calm satisfied smile, glasses gleaming',
      superattack: 'an elderly bald bespectacled scientist in a long white lab coat over a dark sweater, standing in the LEFT half of the frame with his whole body clearly visible, both hands sweeping toward the RIGHT, a horizontal STREAM OF GLOWING CYAN NUMBERS pouring toward the RIGHT at chest height across the empty right half of the frame — big clearly readable separate digits like 2, 8, 4, 1 and 6, no other symbols — clear of his body, side view, braced stance',
      ...COMMON,
    },
  },

  charpentier: {
    label: 'Emmanuelle Charpentier — CRISPR-Cas9',
    reference: 'Emmanuelle Charpentier',
    // Décrit d'après l'image de référence fournie.
    description:
      'a 50-year-old woman with a large volume of dark brown curly hair framing her face and ' +
      'falling to her shoulders, a thin delicate face with fine features, wearing an open white ' +
      'lab coat over dark clothes, a lanyard around her neck, dark trousers and black boots',
    anims: {
      idle: 'a female scientist with dark curly shoulder-length hair in an open white lab coat over dark clothes, standing still in a poised fighting stance, breathing calmly, her lanyard swinging slightly, fingers opening and closing like scissor blades, eyes fixed on her target',
      walk: 'a female scientist with dark curly shoulder-length hair in an open white lab coat over dark clothes, walking forward with a brisk purposeful stride, lab coat flapping',
      jump: 'a female scientist with dark curly shoulder-length hair in an open white lab coat over dark clothes, in mid-air after a jump, lab coat flaring, arms out for balance',
      crouch: 'a female scientist with dark curly shoulder-length hair in an open white lab coat over dark clothes, crouching low into a defensive stance, one knee bent, subtle breathing bob',
      punch: 'a female scientist with dark curly shoulder-length hair in an open white lab coat over dark clothes, stabbing a pair of fine surgical scissors forward to the RIGHT at full arm extension, dramatic street fighter style, sharply focused',
      kick: 'a female scientist with dark curly shoulder-length hair in an open white lab coat over dark clothes, standing in the LEFT half of the frame with her whole body clearly visible, hurling a SMALL pair of glowing violet scissors, no bigger than her hand, spinning away toward the RIGHT at chest height through the empty right half of the frame, the little scissors flying alone with a short violet trail, side view',
      taunt: 'a female scientist with dark curly shoulder-length hair in an open white lab coat over dark clothes, taunting the opponent by snipping a pair of scissors twice in the air with a confident smirk',
      victory: 'a female scientist with dark curly shoulder-length hair in an open white lab coat over dark clothes, celebrating a win, holding a pair of scissors up high, a bright triumphant smile',
      superattack: 'a female scientist with dark curly shoulder-length hair in an open white lab coat over dark clothes, standing in the LEFT half of the frame with her whole body clearly visible, one hand flung toward the RIGHT, ONE LARGE pair of glowing violet scissors, as long as her arm, spinning away horizontally toward the RIGHT at chest height through the empty right half of the frame and reaching the right edge, the scissors completely clear of her body, side view',
      ...COMMON,
    },
  },

  fraser: {
    label: 'Claire Fraser — sequencage de genome complet',
    reference: 'Claire Fraser',
    // Décrit d'après l'image de référence fournie.
    description:
      'a full-body standing portrait from head to feet of a 50-year-old woman, her whole body ' +
      'visible including her legs and shoes, long dark chestnut brown hair parted to one side, ' +
      'an oval face with a confident expression, wearing a plain buttoned white lab coat with no ' +
      'badge and no logo, grey trousers and dark shoes',
    anims: {
      idle: 'a female scientist with shoulder-length auburn hair in a white lab coat and grey trousers, standing still in an alert fighting stance, breathing calmly, her hair shifting slightly, one hand slowly opening and closing as if drawing something toward her',
      walk: 'a female scientist with shoulder-length auburn hair in a white lab coat and grey trousers, walking forward with a confident stride, lab coat swaying',
      jump: 'a female scientist with shoulder-length auburn hair in a white lab coat and grey trousers, in mid-air after a jump, lab coat flaring, arms out for balance',
      crouch: 'a female scientist with shoulder-length auburn hair in a white lab coat and grey trousers, crouching low into a defensive stance, one knee bent, subtle breathing bob',
      punch: 'a female scientist with shoulder-length auburn hair in a white lab coat and grey trousers, driving a straight punch forward to the RIGHT at full arm extension, dramatic street fighter style, determined expression',
      kick: 'a female scientist with shoulder-length auburn hair in a white lab coat and grey trousers, standing in the LEFT half of the frame with her whole body clearly visible, one hand outstretched toward the RIGHT and pulling, ONE green glowing a DNA DOUBLE HELIX — two strands twisted around each other with short rungs between them, like a twisted rope ladder, stretching from the RIGHT edge of the frame back INTO her open palm, flowing right to left through the empty right half of the frame, side view',
      taunt: 'a female scientist with shoulder-length auburn hair in a white lab coat and grey trousers, taunting the opponent with a knowing smile and a slow beckoning curl of her fingers, as if drawing something out of them',
      victory: 'a female scientist with shoulder-length auburn hair in a white lab coat and grey trousers, celebrating a win, arms raised with a broad confident smile, glowing green threads dissolving around her hands',
      superattack: 'a female scientist with shoulder-length auburn hair in a white lab coat and grey trousers, standing in the LEFT half of the frame with her whole body clearly visible, both hands outstretched toward the RIGHT and pulling hard, ONE THICK green glowing DNA DOUBLE HELIX — two strands twisted around each other with clear rungs between them — stretching from the RIGHT edge of the frame back INTO her open palms, flowing right to left through the empty right half of the frame, side view',
      ...COMMON,
    },
  },

  evans: {
    label: 'Alice Evans — pasteurisation',
    reference: 'Alice Evans',
    // Décrit d'après l'image de référence fournie.
    description:
      'a 70-year-old woman with white hair pinned up in a bun, a lined stern face, a pearl ' +
      'necklace at her throat, wearing a long open white lab coat over a dark high-necked ' +
      'ankle-length dress and dark shoes',
    anims: {
      idle: 'an elderly female scientist with white pinned-up hair in a long white lab coat over a dark dress, standing very upright and still in a dignified fighting stance, breathing steadily, the hem of her long lab coat swaying gently, her pearl necklace catching the light, unflinching',
      walk: 'an elderly female scientist with white pinned-up hair in a long white lab coat over a dark dress, walking forward with a firm determined stride, long lab coat swaying',
      jump: 'an elderly female scientist with white pinned-up hair in a long white lab coat over a dark dress, in mid-air after a jump, long lab coat flaring, arms out for balance',
      crouch: 'an elderly female scientist with white pinned-up hair in a long white lab coat over a dark dress, crouching low into a defensive stance, one knee bent, subtle breathing bob',
      punch: 'an elderly female scientist with white pinned-up hair in a long white lab coat over a dark dress, swinging a heavy steel milk can forward to the RIGHT at full arm extension, dramatic street fighter style, fierce determined expression',
      kick: 'an elderly female scientist with white pinned-up hair in a long white lab coat over a dark dress, standing in the LEFT half of the frame with her whole body clearly visible, hurling a SMALL burst of white-hot steam, no bigger than her head, from a steel milk can toward the RIGHT at chest height, the compact steam burst flying alone through the empty right half of the frame, side view',
      taunt: 'an elderly female scientist with white pinned-up hair in a long white lab coat over a dark dress, taunting the opponent with a stern disapproving shake of her head and a pointed finger',
      victory: 'an elderly female scientist with white pinned-up hair in a long white lab coat over a dark dress, celebrating a win, raising a steel milk can overhead, a fierce satisfied smile',
      superattack: 'an elderly female scientist with white pinned-up hair in a long white lab coat over a dark dress, standing in the LEFT half of the frame with her whole body clearly visible, aiming a heavy steel milk can toward the RIGHT, a NARROW horizontal jet of white-hot steam, no thicker than her own arm, blasting toward the RIGHT at chest height through the empty right half of the frame, the jet starting clear of her body, side view, braced stance',
      ...COMMON,
    },
  },

  appert: {
    label: 'Nicolas Appert — inventeur de la conserve',
    reference: 'Nicolas Appert',
    // Décrit d'après l'image de référence fournie.
    description:
      'a 55-year-old man from the early nineteenth century, bald on top with dark hair at the ' +
      'sides, clean-shaven with a strong jaw, wearing an open white lab coat over a dark blue ' +
      'high-collared waistcoat and a white period shirt, dark trousers and buckled shoes',
    anims: {
      idle: 'a bald nineteenth-century scientist in a white lab coat over a dark blue high-collared waistcoat, standing still and solid in a heavy fighting stance, breathing slowly and deeply, his broad chest rising and falling, the hem of his lab coat swaying, patient and immovable',
      walk: 'a bald nineteenth-century scientist in a white lab coat over a dark blue high-collared waistcoat, walking forward with a slow heavy deliberate stride, lab coat swaying',
      jump: 'a bald nineteenth-century scientist in a white lab coat over a dark blue high-collared waistcoat, in mid-air after a heavy jump, lab coat flaring, arms out for balance',
      crouch: 'a bald nineteenth-century scientist in a white lab coat over a dark blue high-collared waistcoat, crouching low into a defensive stance, one knee bent, subtle breathing bob',
      punch: 'a bald nineteenth-century scientist in a white lab coat over a dark blue high-collared waistcoat, swinging a heavy thick glass preserving jar forward to the RIGHT at full arm extension like a club, dramatic street fighter style, grim expression',
      kick: 'a bald nineteenth-century scientist in a white lab coat over a dark blue high-collared waistcoat, standing in the LEFT half of the frame with his whole body clearly visible, hurling a SMALL burst of white-hot steam, no bigger than his head, from a thick glass preserving jar toward the RIGHT at chest height, the compact steam burst flying alone through the empty right half of the frame, side view',
      taunt: 'a bald nineteenth-century scientist in a white lab coat over a dark blue high-collared waistcoat, taunting the opponent by calmly sealing a glass preserving jar and tapping its lid, utterly unimpressed',
      victory: 'a bald nineteenth-century scientist in a white lab coat over a dark blue high-collared waistcoat, celebrating a win, holding a sealed glass preserving jar overhead in both hands, a broad satisfied grin',
      superattack: 'a bald nineteenth-century scientist in a white lab coat over a dark blue high-collared waistcoat, standing in the LEFT half of the frame with his whole body clearly visible, both palms thrust toward the RIGHT, ONE THICK horizontal blast of white-hot steam roaring away toward the RIGHT at chest height across the empty right half of the frame and reaching the right edge, the steam starting clear of his hands and never covering his body, nothing else in his hands, side view, braced stance',
      ...COMMON,
    },
  },

  pasteur: {
    label: 'Louis Pasteur — microbiologie culturale',
    reference: 'Louis Pasteur',
    // Décrit d'après l'image de référence fournie.
    description:
      'a 60-year-old man with a broad high forehead, receding grey hair swept back, a full bushy ' +
      'grey beard and moustache covering his jaw and upper lip, deep-set serious dark eyes, ' +
      'heavy brow, wearing a white lab coat open over a dark waistcoat and a black bow tie',
    anims: {
      idle: 'an elderly grey-bearded scientist in a white lab coat over a dark waistcoat and black bow tie, standing still in a grave upright fighting stance, breathing slowly, his beard shifting with each breath, the hem of his lab coat swaying gently, watchful and severe',
      walk: 'an elderly grey-bearded scientist in a white lab coat over a dark waistcoat and black bow tie, walking forward with a slow authoritative stride, lab coat swaying',
      jump: 'an elderly grey-bearded scientist in a white lab coat over a dark waistcoat and black bow tie, in mid-air after a jump, lab coat flaring, arms out for balance',
      crouch: 'an elderly grey-bearded scientist in a white lab coat over a dark waistcoat and black bow tie, crouching low into a defensive stance, one knee bent, subtle breathing bob',
      punch: 'an elderly grey-bearded scientist in a white lab coat over a dark waistcoat and black bow tie, swinging a long-necked swan-neck glass flask forward to the RIGHT at full arm extension, dramatic street fighter style, severe expression',
      kick: 'an elderly grey-bearded scientist in a white lab coat over a dark waistcoat and black bow tie, standing in the LEFT half of the frame with his whole body clearly visible, holding a lit Bunsen burner out at full arm extension to the RIGHT, one long orange and blue flame shooting sideways to the RIGHT from the nozzle like a blowtorch, the flame stretching horizontally through the empty right half of the frame, no fire touching or surrounding his body, side view, braced stance',
      taunt: 'an elderly grey-bearded scientist in a white lab coat over a dark waistcoat and black bow tie, taunting the opponent by slowly wagging a finger with a severe disapproving frown, holding a petri dish in his other hand',
      victory: 'an elderly grey-bearded scientist in a white lab coat over a dark waistcoat and black bow tie, celebrating a win, raising a swan-neck flask overhead, a grave dignified nod of satisfaction',
      superattack: 'an elderly grey-bearded scientist in a white lab coat over a dark waistcoat and black bow tie, standing in the LEFT half of the frame with his whole body clearly visible, both hands flung toward the RIGHT, a SINGLE large translucent amber cube of jelly, no taller than himself, forming alone in the empty right half of the frame at ground level, the cube completely clear of his body, side view, braced stance',
      ...COMMON,
    },
  },

  metchnikoff: {
    label: 'Élie Metchnikoff — ferments lactiques et probiotiques',
    reference: 'Élie Metchnikoff',
    // Décrit d'après l'image de référence fournie.
    description:
      'a 70-year-old man with grey receding hair, a long full white and grey beard reaching his ' +
      'chest, round spectacles, a kindly lined face, wearing a white lab coat over a dark ' +
      'waistcoat and a black bow tie, dark trousers',
    anims: {
      idle: 'an elderly white-bearded scientist with round spectacles in a white lab coat over a dark waistcoat, standing still in a calm open fighting stance, breathing slowly, his long white beard shifting with each breath, one hand cupped protectively at his chest as if holding something alive',
      walk: 'an elderly white-bearded scientist with round spectacles in a white lab coat over a dark waistcoat, walking forward with a steady patient stride, lab coat swaying',
      jump: 'an elderly white-bearded scientist with round spectacles in a white lab coat over a dark waistcoat, in mid-air after a jump, lab coat flaring, arms out for balance',
      crouch: 'an elderly white-bearded scientist with round spectacles in a white lab coat over a dark waistcoat, crouching low into a defensive stance, one knee bent, subtle breathing bob',
      punch: 'an elderly white-bearded scientist with round spectacles in a white lab coat over a dark waistcoat, thrusting a ceramic yoghurt bowl forward to the RIGHT at full arm extension like a shield bash, dramatic street fighter style, fierce expression',
      kick: 'an elderly white-bearded scientist with round spectacles in a white lab coat over a dark waistcoat, standing in the LEFT half of the frame with his whole body clearly visible, opening a ceramic bowl from which ONE small white CAPSULE-SHAPED creature with two round eyes and a tiny smile, shaped like a grain of rice, leaps out toward the RIGHT at chest height, flying alone through the empty right half of the frame, side view',
      taunt: 'an elderly white-bearded scientist with round spectacles in a white lab coat over a dark waistcoat, taunting the opponent by calmly stirring a bowl of yoghurt and smiling kindly, utterly unbothered',
      victory: 'an elderly white-bearded scientist with round spectacles in a white lab coat over a dark waistcoat, celebrating a win, raising a ceramic bowl overhead, a warm delighted smile, tiny creamy-white rod-shaped creatures dancing around him',
      superattack: 'an elderly white-bearded scientist with round spectacles in a white lab coat over a dark waistcoat, standing in the LEFT half of the frame with his whole body clearly visible, tipping a ceramic bowl toward the RIGHT from which ONE BIG white CAPSULE-SHAPED creature, shaped like a grain of rice with two round eyes and a wide smile, charges away toward the RIGHT at chest height through the empty right half of the frame, side view',
      ...COMMON,
    },
  },
};

// Pour les coups, on garde la frame de départ (pose neutre) comme frame 0 : le
// coup part visuellement de la garde, ce qui rend les 5 frames lisibles.
// `keep_first_frame` conserve la pose de référence du personnage comme frame 0.
// L'idle en fait partie : sans ça, la boucle de respiration repartirait d'une
// pose inventée et le personnage changerait d'allure au repos, qui est
// justement l'état où on le regarde le plus longtemps.
const KEEP_FIRST_FRAME = new Set(['idle', 'punch', 'kick', 'hurt', 'ko', 'taunt', 'victory', 'superattack']);

// L'ordre dans lequel generate-sprites.js les génère par défaut.
const ANIMATION_ORDER = [
  'idle', 'walk', 'jump', 'crouch', 'punch', 'kick', 'hurt', 'ko', 'taunt', 'victory', 'superattack',
];

module.exports = { CHARACTERS, KEEP_FIRST_FRAME, ANIMATION_ORDER };
