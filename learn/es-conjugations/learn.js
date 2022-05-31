import data from './es-conjugations.js'
import { learn } from 'suffix-thumb'
// https://github.com/ghidinelli/fred-jehle-spanish-verbs


let tense = 'Future'

let subj = 'first'
let all = {}
const vbOrder = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural']
Object.keys(data).forEach(inf => {
  all[inf] = []
  vbOrder.forEach(form => {
    all[inf].push(data[inf][tense][form] || '')
    // if (data[inf][tense][form]) {
    // }
  })

  if (all[inf].length !== 6) {
    console.log(inf)
  }
})
// console.log(all)
// let model = learn(all)
console.log(JSON.stringify(all, null, 2))
