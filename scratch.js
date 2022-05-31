import nlp from './src/index.js'

// nlp.verbose('tagger')

let txt = 'Sí, sabes que ya llevo un rato mirándote. Tengo que bailar contigo hoy'
txt = 'el es muy bueno asdfial'
txt = 'Sí, sabes que ya llevo un rato mirándote. Tengo que bailar contigo hoy'
txt = 'comotio'


txt = `Nosotras comimos los zapatos calientes`
txt = `Ellas comen el zapato, nosotras comimos`
txt = `tiramos nuestros zapatos al río`
let doc = nlp(txt)
// doc.compute('root')
// doc.debug()
// doc.match('{jeter}').debug()
// console.log(doc.json()[0].terms.map(t => t.root))


import pairs from './adjectives.js'
import toPlural from './src/lexicon/methods/nouns/toPlural.js'
import toSingular from './src/lexicon/methods/nouns/toSingular.js'


let res = pairs.filter(a => {
  // if (a[0].endsWith('s')) {
  //   return true
  // }
  // if (toPlural(a[0]) !== a[1]) {
  //   return true
  // }
  if (toSingular(a[1]) !== a[0]) {
    return true
  }
  return false
})
res = res.filter(a => a[0] !== a[1])
console.log(res)
console.log(pairs.length, ' -> ', res.length)
// console.log(JSON.stringify(res, null, 2))


// proof-of-concept verb-conjugation
// let conjugate = doc.methods.one.transform.conjugate
// console.log(conjugate.toPresent('llorar'))

