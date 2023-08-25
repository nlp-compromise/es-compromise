import nlp from './src/index.js'
nlp.verbose('tagger')
/*
0.0.2 - tagger 87%
*/

// nlp.verbose('tagger')

let arr = [
  // 'Mezcle un lantadyme limpio',
  // 'no quiero quemarme',
  // 'bañarme',
  // 'vestirte',
  // 'odiado',
  // 'lo he ganado dos veces',
  // 'Las medidas de asistencia que se determinarán en cooperación',

  'Tú expandes tu negocio.', //'Noun, Noun, Noun, Verb' -
  'Ellos intercambian opiniones.', //'Noun, Verb, Noun' -
  'Yo confundo los nombres.', //'Noun, Verb, Determiner, Verb' -
  'Ellos enfrentan el reto.', //'Noun, Verb, Determiner, Verb' -
  'Tú designas al líder.', //'Noun, Noun, Preposition, Determiner, Noun' -
  'Tú elaboras el informe.', //'Noun, Noun, Determiner, Verb' -
  'Ellos innovan en tecnología.', //'Noun, Verb, Preposition, Noun' -
  'Tú generas ideas.', //'Noun, Noun, Verb' -
  'Ella orienta a los estudiantes.', //'Noun, Noun, Preposition, Determiner, Noun' -
  'Yo amplío la información.', //'Noun, Noun, Determiner, Noun' -
  'Si pudieras volar, ¿lo harías?' //'Condition, Noun, Verb, Noun, Verb' -
]
let txt = arr[0]

let doc = nlp(txt).debug()
// console.log(doc.verbs().conjugate()[0])
// console.log(doc.docs)
// doc.match('{odiar}').debug()
// doc.debug()
// console.log(nlp('ganar').verbs().conjugate())

// console.log(nlp('expandir').verbs().conjugate())
// doc.compute('root')
// console.log(doc.docs)
// doc.match('{relajar}').debug()
// console.log(nlp.parseMatch(`{relajar}`))
// doc.compute('root')
// doc.debug()
// // doc.nouns().toSingular()
// doc.match(`{opuesto}`).debug()
// doc.debug()
