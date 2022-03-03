import parse from './parse.js'

const want = 'Conjunction'

const topk = function (arr) {
  let obj = {}
  arr.forEach(a => {
    obj[a] = obj[a] || 0
    obj[a] += 1
  })
  let res = Object.keys(obj).map(k => [k, obj[k]])
  return res.sort((a, b) => (a[1] > b[1] ? -1 : 0))
}

let all = []

for (let i = 1; i < 2; i += 1) {
  parse(i).forEach(s => {
    s.words.forEach(t => {
      if (t.tag === want) {
        all.push(t.word.toLowerCase())
      }
    })
  })
}

all = topk(all).filter(a => a[1] > 5).map(a => a[0])
console.log(JSON.stringify(all, null, 2))