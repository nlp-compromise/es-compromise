import parse from './parse.js'
import fs from 'fs'

const want = 'Gerund'

let lemmas = {}

for (let i = 1; i < 3; i += 1) {
  parse(i).forEach(s => {
    s.words.forEach(t => {
      if (t.tag === want) {
        // console.log(t)
        lemmas[t.lemma] = lemmas[t.lemma] || t.word
      }
    })
  })
}
// console.log(lemmas)
let all = Object.entries(lemmas)
// console.log(all)
// all = all.map(a => [a[0], a[2]])

// // lemmas = Object.entries(lemmas)
fs.writeFileSync('./gerunds.js', 'export default ' + JSON.stringify(all, null, 2))

