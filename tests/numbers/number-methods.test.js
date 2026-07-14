import test from 'tape'
import nlp from '../_lib.js'
let here = '[number-methods] '
nlp.verbose(false)

test('numbers-get:', function (t) {
  let nums = nlp('tres perros, cinco gatos y nueve patos').numbers().get()
  t.deepEqual(nums, [3, 5, 9], here + 'get multiple text-numbers')

  nums = nlp('página 99').numbers().get()
  t.deepEqual(nums, [99], here + 'get numeric')
  t.end()
})

test('numbers-parse:', function (t) {
  let obj = nlp('veintidós').numbers().parse()[0]
  t.equal(obj.num, 22, here + 'parse num')
  t.equal(obj.isText, true, here + 'parse isText')
  t.equal(obj.isOrdinal, false, here + 'parse isOrdinal')

  let json = nlp('veintidós').numbers().json()[0]
  t.equal(json.number.num, 22, here + 'json num')
  t.end()
})

test('numbers-set:', function (t) {
  let doc = nlp('tengo cinco gatos')
  doc.numbers().set(3)
  t.equal(doc.text(), 'tengo tres gatos', here + 'set text-number')

  doc = nlp('página 99')
  doc.numbers().set(12)
  t.equal(doc.text(), 'página 12', here + 'set numeric')
  t.end()
})

test('numbers-arithmetic:', function (t) {
  let doc = nlp('compré dos manzanas')
  doc.numbers().add(2)
  t.equal(doc.text(), 'compré cuatro manzanas', here + 'add text-number')

  doc = nlp('diez euros')
  doc.numbers().subtract(3)
  t.equal(doc.text(), 'siete euros', here + 'subtract text-number')

  doc = nlp('página 99')
  doc.numbers().increment()
  t.equal(doc.text(), 'página 100', here + 'increment numeric')

  doc = nlp('el tercero lugar')
  doc.numbers().increment()
  t.equal(doc.text(), 'el cuarto lugar', here + 'increment ordinal')

  doc = nlp('cinco')
  doc.numbers().decrement()
  t.equal(doc.text(), 'cuatro', here + 'decrement text-number')
  t.end()
})

test('numbers-compare:', function (t) {
  let doc = nlp('tres perros, cinco gatos y nueve patos')
  t.equal(doc.numbers().greaterThan(4).length, 2, here + 'greaterThan')
  t.equal(doc.numbers().lessThan(4).text(), 'tres', here + 'lessThan')
  t.equal(doc.numbers().between(1, 6).length, 2, here + 'between')
  t.equal(doc.numbers().isEqual(5).text(), 'cinco', here + 'isEqual')
  t.equal(nlp('hay siete').numbers().isEqual(7).found, true, here + 'isEqual found')
  t.end()
})

test('numbers-filter-ordinal:', function (t) {
  let doc = nlp('el tercero intento')
  t.equal(doc.numbers().isOrdinal().text(), 'tercero', here + 'isOrdinal')
  t.equal(doc.numbers().isCardinal().found, false, here + 'ordinal is not cardinal')

  doc = nlp('tres intentos')
  t.equal(doc.numbers().isCardinal().text(), 'tres', here + 'isCardinal')
  t.equal(doc.numbers().isOrdinal().found, false, here + 'cardinal is not ordinal')
  t.end()
})
