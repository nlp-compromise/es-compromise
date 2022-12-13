import json from './jehle_verb_lookup.js'

let types = {
  yo: 'first',
  'tú': 'second',
  'él/ella/usted': 'third',
  'nosotros/nosotras': 'firstPlural',
  'vosotros/vosotras': 'secondPlural',
  'ellos/ellas/ustedes': 'thirdPlural'
}
let byInf = {}
Object.keys(json).forEach(k => {
  let a = json[k]
  a.forEach(obj => {
    if ((obj.mood === "Imperative Affirmative" || obj.mood === "Imperative Negative") && obj.tense === "Present") {
      // if (obj.mood === "Subjunctive" && obj.tense === "Present") {
      byInf[obj.infinitive] = byInf[obj.infinitive] || {}
      if (!types[obj.performer]) {
      }
      let type = types[obj.performer]
      byInf[obj.infinitive][type] = k
    }
  })
})
Object.keys(byInf).forEach(k => {
  if (Object.keys(byInf[k]).length < 4) {
    delete byInf[k]
  }
})
// console.log(Object.keys(byInf).length)

let out = {}
let arr = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural']
Object.keys(byInf).forEach(k => {
  out[k] = arr.map(type => {
    return byInf[k][type] || ''
  })
})
console.log(JSON.stringify(out, null, 2))