import data from '../data.js'

const toCardinal = {}
const toNumber = {}

Object.keys(data).forEach(k => {
  data[k].forEach(a => {
    let [num, card, ord] = a
    toCardinal[ord] = card
    toNumber[card] = num
  })
})
// add extras
toNumber['cien'] = 100

export { toCardinal, toNumber }