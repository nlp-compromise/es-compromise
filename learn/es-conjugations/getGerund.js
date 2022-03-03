import fs from 'fs'
import { find } from 'suffix-thumb'
const data = JSON.parse(fs.readFileSync('/Users/spencer/Desktop/es_conjugations.json').toString())

let all = []
Object.keys(data).forEach(k => {
  data[k].forEach(obj => {
    if (obj.tense === 'Gerund') {
      all.push([obj.verb, k])
    }
  })
})
// console.log(JSON.stringify(all, null, 2))

// console.log(all)
let model = find(all)
console.log(model)
