import parse from './parse.js'
import fs from 'fs'

const want = 'Adjective'

let lemmas = {}

for (let i = 1; i < 30; i += 1) {
  parse(i).forEach(s => {
    s.words.forEach(t => {
      if (t.tag === want) {
        // console.log(t)
        lemmas[t.lemma] = lemmas[t.lemma] || ['', '', '', '', 0]
        lemmas[t.lemma][4] += 1
        if (t.gender === 'm') {
          if (t.plural === true) {
            lemmas[t.lemma][2] = t.word
          } else {
            lemmas[t.lemma][0] = t.word
          }
        }
        if (t.gender === 'f') {
          if (t.plural === true) {
            lemmas[t.lemma][3] = t.word
          } else {
            lemmas[t.lemma][1] = t.word
          }
        }
      }
    })
  })
}
// console.log(lemmas)
let all = Object.values(lemmas)
all = all.sort((a, b) => {
  if (a[4] > b[4]) {
    return -1
  } else if (a[4] < b[4]) {
    return 1
  }
  return 0
})
all = all.filter(a => {
  if (a[4] < 25) {
    return false
  }
  return a[0] || a[1] || a[2] || a[3]
  // return true
  // return (a[0] && a[2]) //|| (a[1] && a[3])
})
// console.log(all)
// all = all.map(a => [a[0], a[2]])

// // lemmas = Object.entries(lemmas)
fs.writeFileSync('./adjectives.js', 'export default ' + JSON.stringify(all, null, 2))

