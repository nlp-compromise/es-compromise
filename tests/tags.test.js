import test from 'tape'
import nlp from './_lib.js'
let here = '[tags] '
nlp.verbose(false)

test('tense-tags:', function (t) {
  let arr = [
    // pretérito imperfecto
    ['hablaba', '(#Imperfect && #PastTense)'],
    ['comían', '(#Imperfect && #PastTense)'],
    ['vivíamos', '(#Imperfect && #PastTense)'],
    ['cantabas', '(#Imperfect && #PastTense)'],
    ['trabajaban', '(#Imperfect && #PastTense)'],
    // imperfect subjunctive (-ra form)
    ['hablara', '#Subjunctive'],
    ['comieran', '#Subjunctive'],
    ['viviera', '#Subjunctive'],
    ['llegaras', '#Subjunctive'],
    // imperfect subjunctive (-se form)
    ['hablase', '#Subjunctive'],
    ['viviese', '#Subjunctive'],
    ['comiesen', '#Subjunctive'],
    // gerunds
    ['corriendo', '#Gerund'],
    ['leyendo', '#Gerund'],
    ['durmiendo', '#Gerund'],
    ['escribiendo', '#Gerund'],
    // infinitives
    ['hablar', '#Infinitive'],
    ['comer', '#Infinitive'],
    ['ir', '#Infinitive'],
    ['construir', '#Infinitive'],
    // copulas
    ['somos', '#Copula'],
    ['estaban', '#Copula'],
    ['fueron', '#Copula'],
    // verbs with enclitic pronouns
    ['dámelo', '#Verb'],
    ['quemarme', '#Verb'],
    ['vistiéndose', '#Verb'],
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str)
    let tags = doc.json()[0].terms.map((term) => term.tags[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    let m = doc.match(match)
    t.equal(m.text(), doc.text(), here + msg)
  })
  t.end()
})

test('word-class-tags:', function (t) {
  let arr = [
    // pronouns
    ['yo', '#Pronoun'],
    ['tú', '#Pronoun'],
    ['ella', '#Pronoun'],
    ['nosotros', '#Pronoun'],
    ['ustedes', '#Pronoun'],
    // question words
    ['qué', '#QuestionWord'],
    ['cuándo', '#QuestionWord'],
    ['dónde', '#QuestionWord'],
    ['quién', '#QuestionWord'],
    // negatives
    ['no', '#Negative'],
    ['nunca', '#Negative'],
    // conjunctions
    ['pero', '#Conjunction'],
    ['porque', '#Conjunction'],
    ['o', '#Conjunction'],
    // prepositions
    ['sin', '#Preposition'],
    ['sobre', '#Preposition'],
    ['durante', '#Preposition'],
    // adverbs
    ['muy', '#Adverb'],
    ['siempre', '#Adverb'],
    // dates
    ['enero', '#Month'],
    ['febrero', '#Month'],
    ['diciembre', '#Month'],
    ['lunes', '#WeekDay'],
    ['martes', '#WeekDay'],
    ['sábado', '#WeekDay'],
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str)
    let tags = doc.json()[0].terms.map((term) => term.tags[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    let m = doc.match(match)
    t.equal(m.text(), doc.text(), here + msg)
  })
  t.end()
})

test('sentence-tags:', function (t) {
  let arr = [
    ['mi casa es grande', '#Possessive'],
    ['tu perro ladra', '#Possessive'],
    ['Yo trabajaba cuando me llamaste', '#Imperfect'],
    ['la O.N.U. es grande', '#Acronym'],
    ['los libros rojos', '#Plural'],
    ['los libros rojos', '#PluralAdjective'],
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str)
    t.equal(doc.has(match), true, here + `'${str}' has ${match}`)
  })
  t.end()
})
