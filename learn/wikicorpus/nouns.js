import parse from './parse.js'
import fs from 'fs'

const want = 'Noun'

let lemmas = {}

for (let i = 1; i < 30; i += 1) {
  parse(i).forEach(s => {
    s.words.forEach(t => {
      if (t.tag === want) {
        t.lemma = t.lemma.toLowerCase()
        t.word = t.word.toLowerCase()
        if (t.plural === true && t.lemma !== t.word) {
          if (t.word.match(/('|\.|·)/)) {
            return
          }
          lemmas[t.lemma] = t.word
        }
      }
    })
  })
}

let all = Object.entries(lemmas)
fs.writeFileSync('./plurals.js', 'export default ' + JSON.stringify(all, null, 2))

