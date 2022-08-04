import nlp from './src/index.js'

// nlp.verbose('tagger')
/*
0.0.2 - tagger 87%
*/

// let world = nlp.world()
// console.log(world.methods.two)
// let { verbConjugate } = world.methods.two.transform
// doc.compute('root')
// doc.debug()
// doc.match(`{persona}`).debug()

/*
PlayWood a présenté suffisamment de preuves  {suffisant} //adj
suffisamment de détails 

Olvidas tu cumpleaños {olvidar} //verb
nos olvidamos muchas veces


las ligas menores  {menor} //adj


las capacidades que Dios les ha dado  {capacidad} // noun
*/

let txt = `hidrodinámicas`
let doc = nlp(txt).tag(['PluralAdjective', 'FemaleAdjective'])
doc.compute('root')
doc.debug()
console.log(doc.docs[0])
doc.match(`{hidrodinámico}`).debug()

// let txt = `La incorporación estatutaria siguió`
// let doc = nlp(txt)
// doc.compute('root')
// doc.debug()
// doc.match(`{estatutario}`).debug()