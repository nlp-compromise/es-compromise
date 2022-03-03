import data from './es-conjugations.js'
import { find } from 'suffix-thumb'
// https://github.com/ghidinelli/fred-jehle-spanish-verbs

let tense = 'Future'
let subj = 'thirdPlural'
let all = []
Object.keys(data).forEach(inf => {
  let obj = data[inf][tense]
  if (obj && obj[subj]) {
    all.push([inf, obj[subj]])
  }
})
// console.log(all)
let model = find(all)
console.log(model)
