import nlp from './src/index.js'

nlp.verbose('tagger')
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

*/

let txt = `contemplaciones`
let doc = nlp(txt)
doc.compute('root')
doc.debug()
doc.match(`{contemplación}`).debug()