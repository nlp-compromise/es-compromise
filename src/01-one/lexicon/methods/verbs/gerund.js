import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'

let { gerunds } = model
// =-=-
let m = {
  fromGerund: reverse(gerunds.gerunds),
  toGerund: gerunds.gerunds,
}

const fromGerund = function (str) {
  return convert(str, m.fromGerund)
}
const toGerund = function (str) {
  return convert(str, m.toGerund)
}


export { fromGerund, toGerund }

// console.log(toGerund('presentir'))

// import list from '/Users/spencer/mountain/es-compromise/data/models/gerunds.js'
// let miss = []
// list.forEach(a => {
//   let [inf, gerund] = a
//   if (fromGerund(gerund) !== inf) {
//     miss.push(a)
//   }
//   if (toGerund(inf) !== gerund) {
//     miss.push(a)
//   }
// })
// console.log(JSON.stringify(miss, null, 2))
