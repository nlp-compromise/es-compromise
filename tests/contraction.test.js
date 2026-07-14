import test from 'tape'
import nlp from './_lib.js'
let here = '[contraction] '
nlp.verbose(false)

test('contraction-expand:', function (t) {
  // 'al' expands to 'a el'
  let doc = nlp('Vamos al mercado')
  t.equal(doc.has('a el'), true, here + 'al → a el')
  t.equal(doc.has('#Preposition #Determiner mercado'), true, here + 'al gets prep+det tags')

  // 'del' expands to 'de el'
  doc = nlp('la casa del pueblo')
  t.equal(doc.has('de el'), true, here + 'del → de el')
  t.equal(doc.has('#Preposition #Determiner pueblo'), true, here + 'del gets prep+det tags')
  t.end()
})

test('contraction-preserve-text:', function (t) {
  let arr = [
    'Vamos al mercado del pueblo',
    'Ella va al cine',
    'el final del partido',
  ]
  arr.forEach(str => {
    let doc = nlp(str)
    t.equal(doc.text(), str, here + `text preserved: '${str}'`)
  })
  t.end()
})

test('contraction-match-both:', function (t) {
  // matching either the surface or expanded form should work
  let doc = nlp('Te espero al final de la cola')
  t.equal(doc.has('al'), true, here + 'surface form matches')
  t.equal(doc.has('a el final'), true, here + 'expanded form matches')
  t.end()
})
