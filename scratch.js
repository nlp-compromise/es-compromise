import nlp from './src/index.js'
// console.log(nlp.world().methods.two.transform)
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
*/

// let txt = `pseudocientífico`
// let txt = `problema`
// let doc = nlp(txt)
// console.log(doc.nouns().conjugate())

console.log(nlp.parseMatch(`{socavarlos}`))
// doc.compute('root')
// doc.debug()
// // doc.nouns().toSingular()
// doc.match(`{opuesto}`).debug()
// doc.debug()