import nlp from './src/index.js'
nlp.verbose('tagger')
/*
0.0.2 - tagger 87%
*/

nlp.verbose('tagger')
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


let arr = [
  'lo he ganado dos veces',
  'no quiero quemarme',
  'bañarme',
  'No exageres',
  'vestirte',
  'Suelo manejar rápido',
  'nadie ha oído hablar',
  'ficticios',
  'miembros',
  'bruscos',
  'ganadera',//noun
  'china',
  'vegetal',
  'argentina',
  'limítrofes',
  'sonora',
  'Las medidas de asistencia que se determinarán en cooperación'
]
let txt = arr[0]
let doc = nlp(txt).compute('root')
// doc.match('{quemar}').debug()
doc.debug()
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