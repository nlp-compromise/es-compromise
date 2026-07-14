import test from 'tape'
import nlp from './_lib.js'
let here = '[tokenizer] '
nlp.verbose(false)

test('sentence-splitting:', function (t) {
  let arr = [
    ['Fui a Madrid. Luego volví.', 2],
    ['¿Cómo estás? ¡Muy bien! Gracias.', 3],
    ['Hola.', 1],
    ['Me gusta el café', 1],
  ]
  arr.forEach(a => {
    let [str, want] = a
    let doc = nlp(str)
    t.equal(doc.fullSentences().length, want, here + `'${str}' → ${want} sentences`)
  })
  t.end()
})

test('text-roundtrip:', function (t) {
  let arr = [
    '¿Cómo estás?',
    '¡Qué sorpresa!',
    '¿Dónde está la biblioteca?',
    'Los niños juegan en el jardín.',
    'dámelo',
  ]
  arr.forEach(str => {
    let doc = nlp(str)
    t.equal(doc.text(), str, here + `roundtrip '${str}'`)
  })
  t.end()
})

test('wordCount:', function (t) {
  t.equal(nlp('Me gusta el café').wordCount(), 4, here + 'four words')
  t.equal(nlp('hola').wordCount(), 1, here + 'one word')
  t.end()
})
