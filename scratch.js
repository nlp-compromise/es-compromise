import nlp from './src/index.js'

nlp.verbose('tagger')

let txt = 'Sí, sabes que ya llevo un rato mirándote. Tengo que bailar contigo hoy'
txt = 'el es muy bueno asdfial'
txt = 'Sí, sabes que ya llevo un rato mirándote. Tengo que bailar contigo hoy'
txt = 'comotio'
let doc = nlp(txt)
doc.debug()


// proof-of-concept verb-conjugation
// let conjugate = doc.methods.one.transform.conjugate
// console.log(conjugate.toPresent('llorar'))

