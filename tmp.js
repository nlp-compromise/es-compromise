import more from './more.js'
import nlp from './src/index.js'

const equals = (a, b) => JSON.stringify(a) === JSON.stringify(b)

let count = 0
let out = {}
Object.keys(more).forEach((k) => {
  let doc = nlp(k).tag('Infinitive')
  let arr = Object.values(doc.verbs().conjugate()[0].presentTense)
  if (!equals(arr, more[k])) {
    count += 1
    out[k] = more[k]
  }
})
console.log(count)
console.log(out)
