import data from './es-conjugations.js'
import { learn } from 'suffix-thumb'
// https://github.com/ghidinelli/fred-jehle-spanish-verbs


let tense = 'Conditional'

let subj = 'first'
let all = {}
Object.keys(data).forEach(inf => {
  all[inf] = Object.values(data[inf][tense])
  if (all[inf].length !== 6) {
    console.log(inf)
  }
})
// console.log(all)
// let model = learn(all)
console.log(JSON.stringify(all, null, 2))
