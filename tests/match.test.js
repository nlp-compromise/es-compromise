import test from 'tape'
import nlp from './_lib.js'
let here = '[de-match] '
nlp.verbose(false)

test('match:', function (t) {
  let arr = [
    ['spencer', '#Person'],
    ['lloramos', '#Verb'],
    ['lloraríais', '#Verb'],
    ['lloraste', '#Verb'],
    ['lloráis', '#PresentTense'],
    ['junio', '#Month'],
    ['domingo', '#WeekDay'],
    ['234', '#Value'],
    ['chicago', '#City'],
    ['Jamaica', '#Country'],
    ['colorado', '#Place'],
    ['contra', '#Preposition'],
    ['y', '#Conjunction'],
    // ['', ''],
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str)//.compute('tagRank')
    let tags = doc.json()[0].terms.map(term => term.tags[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    let m = doc.match(match)
    t.equal(m.text(), doc.text(), here + msg)
  })
  t.end()
})
