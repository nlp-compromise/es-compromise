import data from '../data.js'

const toCardinal = []
const toOrdinal = {}

Object.keys(data).forEach(k => {
  data[k].forEach(a => {
    let [num, card, ord] = a
    toCardinal[num] = card
    toOrdinal[card] = ord
  })
})
// add extras
toOrdinal.cien = 'centésimo'
export { toCardinal, toOrdinal }