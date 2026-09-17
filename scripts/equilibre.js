// Bilan d'équilibre du roster.
//
// Calcule, pour chaque personnage, les dégâts d'une SÉQUENCE COMPLÈTE — poing,
// pied, spéciale — en incluant les effets continus. C'est tout l'intérêt : une
// brûlure de 3 secondes ajoute 21 dégâts, autant qu'un coup entier, et c'est
// exactement ce qu'on oublie en réglant les valeurs à la main.
//
// Ce que le chiffre NE dit PAS : l'utilité. Un perso de contrôle gagne en
// empêchant l'autre de jouer, pas en tapant fort — L. monocytogenes est dernière
// au total et parfaitement jouable. L'outil sert à repérer ce qui CUMULE gros
// dégâts et gros effets, pas à classer.
//
// Usage : node scripts/equilibre.js
import fs from 'fs';
const lire = (id) => JSON.parse(fs.readFileSync(`js/data/characters/${id}.json`, 'utf8'));
const IDS = ['gram','petri','cereus','listeria','staph','salmonella','botulinum','pseudomonas',
             'shewanella','aspergillus','mullis','franklin','baranyi','charpentier','fraser',
             'evans','appert','pasteur','metchnikoff'];
const P = Object.fromEntries(IDS.map((id) => [id, lire(id)]));

const BURN = 7, POISON = 5;
// Degats d'un coup sur une cible donnee, effets continus compris.
function degats(move, cible) {
  const res = move.ignoreResistance ? 1 : (cible.resistances?.[move.damageType] ?? 1);
  let d = Math.round(move.damage * res);
  const e = move.effect;
  if (e?.type === 'burn')   d += Math.round(BURN * (cible.resistances?.chaleur ?? 1) * e.durationMs / 1000);
  if (e?.type === 'poison') d += Math.round(POISON * (cible.resistances?.toxine ?? 1) * e.durationMs / 1000);
  if (e?.type === 'summon') d += (e.count ?? 1) * (e.damage ?? 0);
  return d;
}
const total = (p, cible) => Object.values(p.moves).reduce((a, m) => a + degats(m, cible), 0);

// Cible neutre : un perso sans aucune resistance.
const NEUTRE = { resistances: {} };
console.log('=== Sequence complete sur une cible SANS resistance ===');
const scores = IDS.map((id) => [id, total(P[id], NEUTRE)]).sort((a, b) => b[1] - a[1]);
for (const [id, t] of scores) {
  const p = P[id];
  const det = Object.values(p.moves).map((m) => degats(m, NEUTRE)).join(' + ');
  console.log(`  ${p.displayName.padEnd(16)} ${String(t).padStart(3)}   (${det})`);
}
const vals = scores.map((x) => x[1]);
console.log(`\n  min ${Math.min(...vals)}  max ${Math.max(...vals)}  ecart x${(Math.max(...vals)/Math.min(...vals)).toFixed(2)}`);

console.log('\n=== Le cas C. botulinum (spores, chaleur x0,25) ===');
for (const id of ['evans','appert','pasteur','gram']) {
  const sup = P[id].moves.superattack;
  console.log(`  ${P[id].displayName.padEnd(16)} speciale ${String(sup.damage).padStart(2)} -> ${String(degats(sup, P.botulinum)).padStart(3)} sur C. botulinum` +
              (sup.ignoreResistance ? '   <- ignore la thermoresistance' : ''));
}

console.log('\n=== Le cas L. monocytogenes sous biofilm (invulnerable 1 s) ===');
for (const id of ['charpentier','franklin']) {
  const k = P[id].moves.kick;
  console.log(`  ${P[id].displayName.padEnd(16)} ${k.pierce ? 'TOUCHE quand meme (pierce)' : 'ne touche pas'}`);
}
