// https://github.com/ghidinelli/fred-jehle-spanish-verbs
import fs from 'fs'
const data = JSON.parse(fs.readFileSync('/Users/spencer/Desktop/es_conjugations.json').toString())
// console.log(data)
const mood = 'Indicative'

// "caminando":
// let tmp= [{"translation": "walking", "verb": "caminar", "tense": "Gerund"}],

let byInfinitive = {}
// let count = 0
Object.keys(data).forEach(k => {
  data[k].forEach(obj => {
    let inf = obj.infinitive
    // count += 1
    if (!inf) {
      // console.log(obj)
    } else {
      byInfinitive[inf] = byInfinitive[inf] || []
      obj.word = k
      byInfinitive[inf].push(obj)
    }
  })
})

let forms = {
  yo: 'first',
  tú: 'second',
  'él/ella/usted': 'third',
  'nosotros/nosotras': 'firstPlural',
  'vosotros/vosotras': 'secondPlural',
  'ellos/ellas/ustedes': 'thirdPlural',
}

console.log(JSON.stringify(byInfinitive.caminar, null, 2))
// sort each one by mood, then subject
Object.keys(byInfinitive).forEach(inf => {
  let byTense = {}
  let arr = byInfinitive[inf]
  arr.forEach(obj => {
    if (obj.mood === mood) {
      byTense[obj.tense] = byTense[obj.tense] || {}
      let form = forms[obj.performer]
      byTense[obj.tense][form] = obj.word
    }
  })
  byInfinitive[inf] = byTense
})

// console.log(byInfinitive.caminar)
// console.dir(byInfinitive.caminar, { depth: 5 })
// console.log(JSON.stringify(byInfinitive, null, 2))
// console.log(count)
