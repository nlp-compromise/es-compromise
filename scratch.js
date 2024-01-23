import nlp from './src/index.js'
nlp.verbose('tagger')
/*
0.0.2 - tagger 87%
*/

// nlp.verbose('tagger')

let arr = [
  'sentar',
  ' él tuviera dinero',
  // 'Si pudieras volar, ¿lo harías?', // - 'Condition, Noun, Verb, Noun, Verb' -
  'Si él tuviera dinero, viajaría.', // - 'Condition, Noun, Noun, Noun, Verb' -
  'Es posible que lloviera mañana.', // - 'Verb, Adjective, Preposition, Noun, Noun' -
  'Yo trabajaba cuando me llamaste.', // - 'Noun, Verb, Noun, Noun, Verb' -
  'Hazme un favor.', // - 'Noun, Determiner, Noun' -
  'Si supieses la verdad, ¿qué harías?', // - 'Condition, Noun, Determiner, Noun, Noun, Verb' -
  'Dame el libro.', // - 'Noun, Determiner, Verb' -
  'Vivíamos en esa casa hace años.', // - 'Verb, Preposition, Noun, Noun, Verb, Noun' -
  'Jugaba al fútbol con mis amigos.', // - 'Verb, Preposition, Determiner, Noun, Preposition, Noun,Noun' -

  'Sé amable.', // - 'Verb, Adjective' -
  'Nosotros íbamos a la escuela juntos.', // - 'Noun, Verb, Preposition, Determiner, Noun, Adjective' -
  'Me gustaría que vinieras a mi fiesta.', // - 'Noun, Verb, Preposition, Noun, Preposition, Noun,Noun' -

  'Si pudiese volar, sería un pájaro.', // - 'Condition, Noun, Verb, Verb, Determiner, Noun' -
  'Cuando era niño, vivía en el campo.', // - 'Noun, Verb, Noun, Noun, Preposition, Determiner, Noun' -
  'Cuando era joven, leía mucho.', // - 'Noun, Verb, Adjective, Noun, Adverb' -
  'Antes jugábamos juntos todos los días.', // - 'Adverb, Verb, Adjective, Noun, Determiner, Noun' -
  'Si fueras más rápido, ganarías.', // - 'Condition, Verb, Adjective, Adjective, Verb' -
  'Cuando era pequeño, temía a la oscuridad.', // - 'Noun, Verb, Adjective, Noun, Preposition,Determiner, Noun' -

  'Hazlo bien.', // - 'Noun, Adverb' -
  'Si tuvieras más tiempo, ¿qué harías?', // - 'Condition, Noun, Adjective, Noun, Noun, Verb' -
  'Ellos se encontraban en la plaza.', // - 'Noun, Noun, Verb, Preposition, Determiner, Noun' -
  'Si pudieras leer mentes, ¿lo harías?', // - 'Condition, Noun, Verb, Adjective, Noun, Verb' -
  'Nosotros bailábamos toda la noche.', // - 'Noun, Verb, Determiner, Determiner, Noun' -
  'Siéntate aquí.', // - 'Verb, Noun' -
  'Di la verdad.', // - 'Verb, Determiner, Noun' -
  'Cuando era niña, jugaba con muñecas.' // - 'Noun, Verb, Noun, Verb, Preposition, Noun' -
]
let txt = arr[0]

let doc = nlp(txt).debug()
// let doc = nlp('preguntarse').debug().compute('root')
// console.log(doc.docs[0])
console.log(doc.verbs().conjugate())

// console.log(nlp.world().model.one.lexicon.hazme)
// console.log(doc.docs)
// doc.match('{odiar}').debug()
// doc.debug()
// console.log(nlp('ganar').verbs().conjugate())

// console.log(nlp('poder').verbs().conjugate())
// doc.compute('root')
// console.log(doc.docs)
// doc.match('{relajar}').debug()
// console.log(nlp.parseMatch(`{relajar}`))
// doc.compute('root')
// doc.debug()
// // doc.nouns().toSingular()
// doc.match(`{opuesto}`).debug()
// doc.debug()
