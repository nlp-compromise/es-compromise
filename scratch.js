import nlp from './src/index.js'
nlp.verbose('tagger')
/*
0.0.2 - tagger 87%
*/

// nlp.verbose('tagger')
// let world = nlp.world()
// console.log(world.methods.two)
// let { verbConjugate } = world.methods.two.transform
// doc.compute('root')
// doc.debug()
// doc.match(`{persona}`).debug()

/*
1st	1º, 1ª, 1er, 1ra
2nd	2º, 2ª, 2do, 2da
3rd	3º, 3ª, 3er, 3ra
4th	4º, 4ª, 4to, 4ta
10th	10º, 10ª, 10mo, 10ma
*/

// let txt = `pseudocientífico`
// let txt = `problema`
// let doc = nlp(txt)
// console.log(doc.nouns().conjugate())


let arr = [
  // 'Mezcle un lantadyme limpio',
  // 'no quiero quemarme',
  // 'bañarme',
  // 'vestirte',
  'odiado',
  'lo he ganado dos veces',
  'Las medidas de asistencia que se determinarán en cooperación',
]
let txt = arr[0]
txt = ''

// txt = 'propinar'
// txt = 'abogar'
txt = 'desplegar'
txt = 'Te espero al final de la cola.'
// txt = 'escupir'

let doc = nlp(txt).debug()
// console.log(doc.verbs().conjugate()[0])
// console.log(doc.docs)
// doc.match('{odiar}').debug()
// doc.debug()
// console.log(nlp('ganar').verbs().conjugate())

// let doc = nlp('relajarse')
// doc.compute('root')
// console.log(doc.docs)
// doc.match('{relajar}').debug()
// console.log(nlp.parseMatch(`{relajar}`))
// doc.compute('root')
// doc.debug()
// // doc.nouns().toSingular()
// doc.match(`{opuesto}`).debug()
// doc.debug()