// Thème "difficulté" — déclenché à 50% de PV. Même base que le thème
// début de combat (même mélodie, même harmonie), mais plus brut/électronique/
// mécanique : tempo plus rapide, aucune reverb, filtres statiques (pas de
// mouvement organique), bitcrush sur l'arpège, sub-bass qui pulse 2x plus vite.

setcpm(66)

const melody = note(`
  [d e f ~ ~]
  [g f e ~ ~]
  [f g a ~ g f]
  [e d ~ ~ ~]

  [d e f ~ g]
  [a g f ~ e]
  [f g a ~ a g]
  [f e d ~ ~ ~]
`).slow(8).add(12).s("sawtooth").distort(1.1).lpf(4500).attack(0.002).release(0.12).room(0).gain(0.45)

const kick = s("bd*4").bank("RolandTR909").gain(0.9)
const hats = s("hh*8").gain(0.2)
const clap = s("~ cp ~ cp").gain(0.55)

const arp = n("0 4 7 4").scale("D:dorian")
  .s("sawtooth")
  .lpf(1800)
  .lpq(8)
  .gain(0.22)
  .crush(6)

const bass = n("<0 0 4 0>/4").scale("D:dorian").s("sawtooth").lpf(500).gain(0.42).distort(0.3)

const subBass = n("<0 0 4 0>/4").scale("D:dorian").add(-7)
  .segment(16)
  .s("sine")
  .gain(0.55)
  .lpf(160)
  .attack(0.005)
  .release(0.08)

stack(
  melody,
  kick,
  hats,
  clap,
  arp,
  bass,
  subBass
)
