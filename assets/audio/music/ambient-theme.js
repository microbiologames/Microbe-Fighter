// Thème début de combat — techno arcade, esprit Stranger Things.
// Même mélodie originale (D dorien) que le thème titre, mais rythmique
// techno (kick four-on-the-floor, hats, clap) + arpège + sub-bass pulsée.
// Boucle complète : 16 cycles.

setcpm(58)

const melody = note(`
  [d e f ~ ~]
  [g f e ~ ~]
  [f g a ~ g f]
  [e d ~ ~ ~]

  [d e f ~ g]
  [a g f ~ e]
  [f g a ~ a g]
  [f e d ~ ~ ~]
`).slow(8).add(12).s("sawtooth").distort(0.8).lpf(5000).attack(0.005).release(0.2).room(0.02).gain(0.4)

const kick = s("bd*4").bank("RolandTR909").gain(0.85)
const hats = s("hh*8").gain(0.18)
const clap = s("~ cp ~ cp").gain(0.5)

const arp = n("0 4 7 4").scale("D:dorian")
  .s("sawtooth")
  .lpf(sine.range(600,1800).slow(4))
  .lpq(5)
  .gain(0.2)

const bass = n("<0 0 4 0>/4").scale("D:dorian").s("sawtooth").lpf(500).gain(0.4)

const subBass = n("<0 0 4 0>/4").scale("D:dorian").add(-7)
  .segment(8)
  .s("sine")
  .gain(0.55)
  .lpf(160)
  .attack(0.01)
  .release(0.15)

stack(
  melody,
  kick,
  hats,
  clap,
  arp,
  bass,
  subBass
)
