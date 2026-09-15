// Thème victoire — fanfare triomphante en D:major (même tonalité que
// l'ambiance et l'écran titre, pour boucler la BO sur une note cohérente)

setcpm(110)

const crash = s("~ ~ ~ ~ crash ~ ~ ~").gain(0.7)
const kick = s("bd ~ bd ~ bd bd ~ bd").bank("RolandTR909").gain(0.85)
const snareRoll = s("~ ~ ~ sd*4").gain(0.5)

const chords = n("[0,4,7] ~ [5,9,12] ~ [7,11,14] ~ [0,4,7] ~").scale("D:major").s("sawtooth").gain(0.5).room(0.4)

const fanfare = n("0 4 7 12 14 12 7 12").scale("D:major").s("square").gain(0.65).attack(0.005).decay(0.15)

stack(
  kick,
  crash,
  snareRoll,
  chords,
  fanfare
)
