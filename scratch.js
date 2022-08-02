import nlp from './src/index.js'

// nlp.verbose('tagger')
/*
0.0.2 - tagger 87%
*/

let doc = nlp("Las personas con hipertensión deben hacer dieta y limitar su consumo de alcohol y este elemento químico")
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