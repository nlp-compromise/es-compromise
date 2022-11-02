import { toCardinal, toNumber } from './_data.js'
const isNumber = /^[0-9,$.+-]+$/

let multiples = {
  // ciento: 100,
  mil: 1000,
  millones: 1000000,
  millón: 1000000,
  billones: 1000000000,
}

const fromText = function (terms) {
  let sum = 0
  let carry = 0
  let minus = false
  for (let i = 0; i < terms.length; i += 1) {
    let { tags, normal } = terms[i]
    let w = normal || ''
    // ... y-ocho
    if (w === 'y') {
      continue
    }
    // minus eight
    if (w === 'menos') {
      minus = true
      continue
    }
    // 'huitieme'
    if (tags.has('Ordinal')) {
      w = toCardinal[w]
    }
    // 'cent'
    if (multiples.hasOwnProperty(w)) {
      let mult = multiples[w] || 1
      if (carry === 0) {
        carry = 1
      }
      // console.log('carry', carry, 'mult', mult, 'sum', sum)
      sum += mult * carry
      carry = 0
      continue
    }
    // 'tres'
    if (toNumber.hasOwnProperty(w)) {
      carry += toNumber[w]
    } else if (isNumber.test(w)) {
      w = w.replace(/[,$+-]/g, '')
      let num = Number(w) || 0
      carry += num
    } else {
      // console.log('missing', w)
      // console.log(terms.map(t => t.text))
    }
  }
  // include any remaining
  if (carry !== 0) {
    sum += carry
  }
  if (minus === true) {
    sum *= -1
  }
  return sum
}
export default fromText