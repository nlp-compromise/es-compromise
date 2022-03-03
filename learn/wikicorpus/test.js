import parse from './parse.js'
import nlp from '../../src/index.js'

const percent = (part, total) => {
  let num = (part / total) * 100;
  num = Math.round(num * 10) / 10;
  return num;
};

let right = 0
let wrong = 0
for (let i = 1; i < 2; i += 1) {
  parse(i).forEach(s => {
    let doc = nlp(s.txt)
    let want = {}
    s.words.forEach(t => {
      let str = t.word.toLowerCase()
      if (t.tag === 'Punctuation') {
        return
      }
      want[str] = t.tag
    })
    doc.terms().forEach(t => {
      let str = t.text('normal')
      if (want[str]) {
        if (t.has('@hasContraction')) {
          return
        }
        if (t.has('#' + want[str])) {
          right += 1
        } else {
          wrong += 1
          // console.log('\n', str, want[str])
          // t.debug()
        }
      }
    })
  })
}

console.log(right, ' right ' + percent(right, right + wrong) + '%')
console.log(wrong, ' wrong ' + percent(wrong, right + wrong) + '%')