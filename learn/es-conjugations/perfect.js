import data from './es-conjugations.js'
import { learn, convert } from 'suffix-thumb'

const pairs = []
const already = new Set()
Object.keys(data).forEach(k => {
  Object.keys(data[k]).forEach(form => {
    const all = Object.values(data[k][form])
    all.forEach(str => {
      if (!already.has(str)) {
        // pairs.push([k, str])
        pairs.push([str, k])
        already.add(str)
      }
    })
  })
})
const model = learn(pairs)
console.log(JSON.stringify(model, null, 2))
// console.log(convert('taparían', model))