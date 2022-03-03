import data from './es-conjugations.js'
import { find } from 'suffix-thumb'
import nlp from 'compromise'

let all = {}
Object.keys(data).forEach(inf => {
  Object.keys(data[inf]).forEach(one => {
    Object.keys(data[inf][one]).forEach(two => {
      let key = nlp(data[inf][one][two]).text('normal')
      let val = nlp(inf).text('normal')
      all[key] = val
    })
  })
})
let pairs = Object.keys(all).map(k => [k, all[k]])
// console.log(pairs)
let model = find(pairs)
console.log(JSON.stringify(model, null, 2))
// console.log(model.rules)
