import test from 'tape'
import nlp from './_lib.js'
let here = '[adj-conjugate] '
nlp.verbose(false)

test('adj-conjugate:', function (t) {
  let all = ["pseudocientífico", "pseudocientífica", "pseudocientíficos", "pseudocientíficas"]
  t.deepEqual(Object.values(nlp(all[0]).adjectives().conjugate()[0]), all, 'from-male')
  t.deepEqual(Object.values(nlp(all[1]).adjectives().conjugate()[0]), all, 'from-female')
  t.deepEqual(Object.values(nlp(all[2]).adjectives().conjugate()[0]), all, 'from-plural')
  t.deepEqual(Object.values(nlp(all[3]).adjectives().conjugate()[0]), all, 'from-female-plural')
  t.end()
})