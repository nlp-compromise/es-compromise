import nlp from './src/index.js'

// nlp.verbose('tagger')

let txt = 'Sí, sabes que ya llevo un rato mirándote. Tengo que bailar contigo hoy'
txt = 'el es muy bueno asdfial'
txt = 'Sí, sabes que ya llevo un rato mirándote. Tengo que bailar contigo hoy'
txt = 'comotio'


txt = `Nosotras comimos los zapatos calientes`
txt = `Ellas comen el zapato, nosotras comimos`
txt = `señalaríamos et señalamos`
let doc = nlp(txt)
doc.compute('root')
doc.debug()
doc.match('{jeter}').debug()
console.log(doc.json()[0].terms.map(t => t.root))


// proof-of-concept verb-conjugation
// let conjugate = doc.methods.one.transform.conjugate
// console.log(conjugate.toPresent('llorar'))

