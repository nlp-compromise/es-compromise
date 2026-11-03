import data from './es-conjugations.js'
// import { learn, convert } from 'suffix-thumb'

const pairs = []
// let already = new Set()
Object.keys(data).forEach(k => {
  pairs.push([k, data[k]['Past Perfect'].first])
})
// let model = learn(pairs)
// console.log(JSON.stringify(model, null, 2))
// console.log(convert('taparían', model))
// console.log(JSON.stringify(pairs, null, 2))