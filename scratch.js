import nlp from './src/index.js'

// nlp.verbose('tagger')
/*
0.0.2 - tagger 87%
*/

let txt = 'Sí, sabes que ya llevo un rato mirándote. Tengo que bailar contigo hoy'
txt = 'el es muy bueno asdfial'
txt = 'Sí, sabes que ya llevo un rato mirándote. Tengo que bailar contigo hoy'
txt = 'comotio'


txt = `Nosotras comimos los zapatos calientes`
txt = `Ellas comen el zapato, nosotras comimos`
txt = `tiramos nuestros zapatos al río`


txt = `Qué irónico`
txt = `Algo irónico`
txt = `la compañía se dispersó`
txt = `te dispersarías, se dispersaría, nos dispersaríamos, os dispersaríais, se dispersarían`
txt = `
me habré dispersado
te habrás dispersado
se habrá dispersado
nos habremos dispersado
os habréis dispersado
se habrán dispersado`
txt = `Determina si has estado abusando del alcohol`
txt = `Uno asesinado; 6 heridos en disputa familiar`
txt = ` porque no están maduras.`
txt = `la compañía se dispersó`
let doc = nlp(txt)
doc.compute('root')
doc.match('{condescender}').debug()
doc.debug()
console.log(doc.docs[0])
// doc.numbers().minus(50)
// doc.text()
// tengo moins diez dolares
