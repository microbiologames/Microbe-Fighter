// Thème écran d'accueil — calme mais tendu, esprit Stranger Things
// (Rhodes vintage + nappe dorienne + drone grave + snare seule, sans kick).
// Mélodie originale validée avec l'utilisateur (D dorien, deux phrases de 4 mesures).
// Boucle complète : 16 cycles (mélodie x4 répétitions pendant 1 progression d'accords).

setcpm(48)

const melody = note(`
  [d e f ~ ~]
  [g f e ~ ~]
  [f g a ~ g f]
  [e d ~ ~ ~]

  [d e f ~ g]
  [a g f ~ e]
  [f g a ~ a g]
  [f e d ~ ~ ~]
`).slow(4).s("gm_epiano1").gain(0.55).room(0.25).attack(0.02).release(0.8)

const pad = n("<[0,3,7] [5,8,13] [3,7,10] [10,13,15]>/4")
  .scale("D:dorian")
  .s("sine")
  .gain(0.22)
  .room(0.35)
  .attack(0.2)
  .release(1.5)
  .lpf(sine.range(300,1100).slow(8))

const subDrone = note("d1").s("sine").gain(sine.range(0.15,0.3).slow(6)).release(4).lpf(180)

const snare = s("~ ~ sd [~ sd]").gain(0.3).room(0.2)

stack(
  melody,
  pad,
  subDrone,
  snare
)
