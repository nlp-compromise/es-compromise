import nlp from './src/index.js'
import data from '/Users/spencer/mountain/es-compromise/data/models/adjectives.js'

// nlp.verbose('tagger')
/*
0.0.2 - tagger 87%
*/

// let world = nlp.world()
// console.log(world.methods.two)
// let { verbConjugate } = world.methods.two.transform
// doc.compute('root')
// doc.debug()
// doc.match(`{persona}`).debug()

/*
*/
// console.log(data.length)
// let missing = data.filter(a => {
//   let doc = nlp(a[0])
//   return !doc.has('#Adjective') && !doc.has('#Value')
// })
// missing = missing.map(a => a[0])
// console.log(missing.length)
// const suffixSort = function (arr) {
//   const reverse = (str = '') => str.split('').reverse().join('')
//   return arr.sort((a, b) => {
//     a = reverse(a)
//     b = reverse(b)
//     if (a > b) {
//       return 1
//     } else if (a < b) {
//       return -1
//     }
//     return 0
//   })
// }

// console.log(JSON.stringify(suffixSort(missing), null, 2))

let txt = `en direcciones opuestas`
let doc = nlp(txt)
doc.compute('root')
doc.debug()
// // doc.nouns().toSingular()
doc.match(`{opuesto}`).debug()
// doc.debug()