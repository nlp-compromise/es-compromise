/* eslint-disable no-console */
// npm i --no-save es-corpus
import repl from 'repl'
import corpus from 'es-corpus'
import nlp from '../src/index.js'

const n = 12000
console.log(` -- pre-processing ${n} sentences-`)
let docs = corpus.some(n)
docs = docs.map((a) => nlp(a[0]).compute('offset'))
console.log(` -- ok, ready --`)

const doMatch = function (match) {
  docs.forEach((doc) => {
    let m = doc.match(match)
    if (m.found) {
      m.debug({ highlight: true, tags: false })
    }
  })
  console.log('--')
}

let arg = process.argv.slice(2).join(' ')
arg = arg.trim()
if (arg) {
  doMatch(arg)
}

repl.start({
  eval: function (match) {
    doMatch(match)
  }
})
