import parse from './parse.js'
import fs from 'fs'

const want = 'Noun'

const topk = function (arr) {
  let obj = {}
  arr.forEach(a => {
    obj[a] = obj[a] || 0
    obj[a] += 1
  })
  let res = Object.keys(obj).map(k => [k, obj[k]])
  return res.sort((a, b) => (a[1] > b[1] ? -1 : 0))
}

let masc = []
let fem = []

for (let i = 1; i < 30; i += 1) {
  parse(i).forEach(s => {
    s.words.forEach(t => {
      if (t.tag === want) {
        if (t.gender === 'm') {
          masc.push(t.word.toLowerCase())
        } else if (t.gender === 'f') {
          fem.push(t.word.toLowerCase())
        }
      }
    })
  })
}

masc = topk(masc).filter(a => a[1] > 5).map(a => a[0])
masc = masc.slice(0, 7000)
fs.writeFileSync('./masc.js', JSON.stringify(masc, null, 2))


fem = topk(fem).filter(a => a[1] > 5).map(a => a[0])
fem = fem.slice(0, 7000)
fs.writeFileSync('./fem.js', JSON.stringify(fem, null, 2))