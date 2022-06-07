import nlp from './src/index.js'

nlp.verbose('tagger')

let txt = 'Sí, sabes que ya llevo un rato mirándote. Tengo que bailar contigo hoy'
txt = 'el es muy bueno asdfial'
txt = 'Sí, sabes que ya llevo un rato mirándote. Tengo que bailar contigo hoy'
txt = 'comotio'


txt = `Nosotras comimos los zapatos calientes`
txt = `Ellas comen el zapato, nosotras comimos`
txt = `tiramos nuestros zapatos al río`


txt = `Qué irónico`
txt = `Algo irónico`
txt = `una apelación oportuna.`
let doc = nlp(txt)
doc.compute('root')
doc.match('{oportuno}').debug()
doc.debug()
console.log(doc.docs[0])
// doc.numbers().minus(50)
// doc.text()
// tengo moins diez dolares
