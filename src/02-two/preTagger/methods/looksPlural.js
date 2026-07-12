
// singular words that end in -s
let exceptions = new Set([
  'análisis',
  'jueves',
  'ciempiés',
  // weekdays
  'lunes',
  'martes',
  'miércoles',
  'viernes',
  // invariants + singulars in -s
  'crisis',
  'tesis',
  'dosis',
  'sintaxis',
  'énfasis',
  'paréntesis',
  'oasis',
  'virus',
  'campus',
  'dios',
  'adiós',
  'vals',
])

const looksPlural = function (str) {
  // not long enough to be plural - 'gas', 'mes', 'res', 'tos'
  if (!str || str.length <= 3) {
    return false
  }
  if (exceptions.has(str)) {
    return false
  }
  if (!str.endsWith('s')) {
    return false
  }
  // stressed final syllable - 'país', 'inglés', 'autobús', 'cortés'
  if (/[áéíóú]s$/.test(str)) {
    return false
  }
  // 'crisis'-type words
  if (str.endsWith('sis') || str.endsWith('xis')) {
    return false
  }
  return true
}
export default looksPlural
