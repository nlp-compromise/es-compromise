import test from 'tape'
import nlp from './_lib.js'
let here = '[root-match] '
nlp.verbose(false)

test('root-match:', function (t) {
  let arr = [
    ['tiramos nuestros zapatos', '{tirar} nuestros zapatos'],
    // "seguir": ["seguí", "seguiste", "siguió", "seguimos", "seguisteis", "siguieron"],
    ['seguir', '{seguir}'],//same
    ['seguí', '{seguir}'],//
    ['seguiste', '{seguir}'],//
    ['siguió', '{seguir}'],//
    ['seguimos', '{seguir}'],//
    ['seguisteis', '{seguir}'],//
    ['siguieron', '{seguir}'],//
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str).compute('root')
    let tags = doc.json()[0].terms.map(term => term.tags[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    t.equal(doc.has(match), true, here + msg)
  })
  t.end()
})
