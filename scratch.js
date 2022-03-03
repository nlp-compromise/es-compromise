import nlp from './src/index.js'

// nlp.verbose('tagger')

let txt = 'Sí, sabes que ya llevo un rato mirándote. Tengo que bailar contigo hoy'
txt = 'spencer'
let doc = nlp(txt)
doc.debug()

console.log(doc.model.one.lexicon.que)

// proof-of-concept verb-conjugation
// let conjugate = doc.methods.one.transform.conjugate
// console.log(conjugate.toPast('verabschieden'))