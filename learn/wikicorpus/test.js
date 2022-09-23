import parse from './parse.js'
import nlp from '../../src/index.js'

const percent = (part, total) => {
  let num = (part / total) * 100;
  num = Math.round(num * 10) / 10;
  return num;
};

let right = 0
let wrong = 0
let oops = []

let bad = {}
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
        if (t.has('@hasContraction') || t.has('#QuestionWord')) {
          return
        }
        if (t.has('#' + want[str])) {
          right += 1
        } else {
          wrong += 1
          if (want[str] === 'Adjective' && t.has('#Noun')) {
            // console.log(str, ',')
            oops.push(str)
          }
          // t.debug()
          bad[str] = bad[str] || 0
          bad[str] += 1
        }
      }
    })
  })
}

// print most-common issues
bad = Object.entries(bad).sort((a, b) => {
  if (a[1] > b[1]) {
    return -1
  } else if (a[1] < b[1]) {
    return 1
  }
  return 0
}).slice(0, 100)
console.log(bad)



console.log(right, ' right ' + percent(right, right + wrong) + '%')
console.log(wrong, ' wrong ' + percent(wrong, right + wrong) + '%')



const topk = function (arr) {
  let obj = {}
  arr.forEach(a => {
    obj[a] = obj[a] || 0
    obj[a] += 1
  })
  let res = Object.keys(obj).map(k => [k, obj[k]])
  return res.sort((a, b) => (a[1] > b[1] ? -1 : 0))
}


let todo = topk(oops).slice(0, 100)//.map(a => a[0])
console.log(JSON.stringify(todo, null, 2))