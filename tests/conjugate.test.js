import test from 'tape'
import nlp from './_lib.js'
let here = '[conjugate] '
nlp.verbose(false)

test('adj-conjugate:', function (t) {
  let all = ["pseudocientífico", "pseudocientífica", "pseudocientíficos", "pseudocientíficas"]
  t.deepEqual(Object.values(nlp(all[0]).adjectives().conjugate()[0]), all, here + 'from-male')
  t.deepEqual(Object.values(nlp(all[1]).adjectives().conjugate()[0]), all, here + 'from-female')
  t.deepEqual(Object.values(nlp(all[2]).adjectives().conjugate()[0]), all, here + 'from-plural')
  t.deepEqual(Object.values(nlp(all[3]).adjectives().conjugate()[0]), all, here + 'from-female-plural')
  t.end()
})

test('adj-conjugate-forms:', function (t) {
  // -or adjectives add 'a' for female
  let o = nlp('encantador').adjectives().conjugate()[0]
  t.equal(o.female, 'encantadora', here + 'or-female')
  t.equal(o.plural, 'encantadores', here + 'or-plural')
  t.equal(o.femalePlural, 'encantadoras', here + 'or-female-plural')

  // -z adjectives pluralize to -ces
  o = nlp('feliz').adjectives().conjugate()[0]
  t.equal(o.plural, 'felices', here + 'z-plural')
  t.end()
})

test('noun-conjugate:', function (t) {
  let all = ["atenuación", "atenuaciones"]
  let o = nlp(all[0]).nouns().conjugate()[0]
  t.deepEqual([o.singular, o.plural], all, here + 'from-sing')

  o = nlp(all[0]).nouns().conjugate()[0]
  t.deepEqual([o.singular, o.plural], all, here + 'from-plural')
  t.end()
})

test('noun-conjugate-forms:', function (t) {
  let arr = [
    ['lápiz', 'lápices'], // -z becomes -ces
    ['la luz', 'luces'],
    ['la ciudad', 'ciudades'], // consonant adds -es
    ['el gato', 'gatos'], // vowel adds -s
  ]
  arr.forEach(a => {
    let [str, plural] = a
    let o = nlp(str).nouns().conjugate()[0]
    t.equal(o.plural, plural, here + `plural of '${str}'`)
  })
  t.end()
})

test('noun-toPlural:', function (t) {
  let arr = [
    ['el gato', 'los gatos'],
    ['la ciudad', 'las ciudades'],
    ['un lápiz', 'unos lápices'],
    ['mi amigo', 'mis amigos'],
  ]
  arr.forEach(a => {
    let [str, want] = a
    let doc = nlp(str)
    doc.nouns().toPlural()
    t.equal(doc.text(), want, here + `'${str}' → '${want}'`)
  })
  t.end()
})

test('noun-toSingular:', function (t) {
  let arr = [
    ['los gatos', 'el gato'],
    ['las casas', 'la casa'],
    ['unas mesas', 'una mesa'],
    ['nuestros amigos', 'nuestro amigo'],
  ]
  arr.forEach(a => {
    let [str, want] = a
    let doc = nlp(str)
    doc.nouns().toSingular()
    t.equal(doc.text(), want, here + `'${str}' → '${want}'`)
  })
  t.end()
})

test('verb-conjugate:', function (t) {
  let all = ["reporto", "reportas", "reporta", "reportamos", "reportáis", "reportan"]
  t.deepEqual(Object.values(nlp(all[0]).verbs().conjugate()[0].presentTense), all, here + 'from-first')
  t.deepEqual(Object.values(nlp(all[1]).verbs().conjugate()[0].presentTense), all, here + 'from-2nd')
  t.deepEqual(Object.values(nlp(all[2]).verbs().conjugate()[0].presentTense), all, here + 'from-3d')
  t.deepEqual(Object.values(nlp(all[3]).verbs().conjugate()[0].presentTense), all, here + 'from-1p')
  t.deepEqual(Object.values(nlp(all[4]).verbs().conjugate()[0].presentTense), all, here + 'from-2p')
  t.deepEqual(Object.values(nlp(all[5]).verbs().conjugate()[0].presentTense), all, here + 'from-3p')
  t.end()
})

test('verb-conjugate-ar:', function (t) {
  let o = nlp('hablar').verbs().conjugate()[0]
  t.deepEqual(Object.values(o.presentTense),
    ['hablo', 'hablas', 'habla', 'hablamos', 'habláis', 'hablan'], here + 'hablar-present')
  t.deepEqual(Object.values(o.pastTense),
    ['hablé', 'hablaste', 'habló', 'hablamos', 'hablasteis', 'hablaron'], here + 'hablar-past')
  t.deepEqual(Object.values(o.futureTense),
    ['hablaré', 'hablarás', 'hablará', 'hablaremos', 'hablaréis', 'hablarán'], here + 'hablar-future')
  t.deepEqual(Object.values(o.conditional),
    ['hablaría', 'hablarías', 'hablaría', 'hablaríamos', 'hablaríais', 'hablarían'], here + 'hablar-conditional')
  t.deepEqual(Object.values(o.subjunctive),
    ['hable', 'hables', 'hable', 'hablemos', 'habléis', 'hablen'], here + 'hablar-subjunctive')
  t.equal(o.gerund, 'hablando', here + 'hablar-gerund')
  t.equal(o.perfecto, 'hablado', here + 'hablar-perfecto')
  t.end()
})

test('verb-conjugate-er-ir:', function (t) {
  let o = nlp('comer').verbs().conjugate()[0]
  t.deepEqual(Object.values(o.pastTense),
    ['comí', 'comiste', 'comió', 'comimos', 'comisteis', 'comieron'], here + 'comer-past')
  t.equal(o.gerund, 'comiendo', here + 'comer-gerund')
  t.equal(o.perfecto, 'comido', here + 'comer-perfecto')

  o = nlp('vivir').verbs().conjugate()[0]
  t.deepEqual(Object.values(o.futureTense),
    ['viviré', 'vivirás', 'vivirá', 'viviremos', 'viviréis', 'vivirán'], here + 'vivir-future')
  t.equal(o.gerund, 'viviendo', here + 'vivir-gerund')
  t.end()
})

test('verb-conjugate-from-sentence:', function (t) {
  // conjugating an inflected verb should find its root first
  let o = nlp('ella habló ayer').verbs().conjugate()[0]
  t.equal(o.presentTense.first, 'hablo', here + 'from-past-3rd')
  t.equal(o.futureTense.third, 'hablará', here + 'from-past-to-future')
  t.equal(o.gerund, 'hablando', here + 'from-past-to-gerund')
  t.end()
})