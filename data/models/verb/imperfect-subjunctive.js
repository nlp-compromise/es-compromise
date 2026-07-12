import pastTense from './past-tense.js'

// imperfecto de subjuntivo (-ra series) - 'si pudiera', 'si fueras'.
// derived regularly from the preterite third-plural:
// 'hablaron' → 'hablara', 'fueron' → 'fuera', 'pudieron' → 'pudiera'
const accent = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' }

let data = {}
Object.keys(pastTense).forEach(inf => {
  let third = pastTense[inf][5]
  if (!third || !third.endsWith('ron')) {
    return
  }
  let stem = third.slice(0, third.length - 3)
  let last = stem.slice(-1)
  // first-plural stresses the stem's final vowel - 'habláramos'
  let accented = stem.slice(0, stem.length - 1) + (accent[last] || last)
  data[inf] = [
    stem + 'ra',
    stem + 'ras',
    stem + 'ra',
    accented + 'ramos',
    stem + 'rais',
    stem + 'ran',
  ]
})

export default data
