import { toCardinal, toOrdinal } from './_data.js'
import data from '../data.js'
let ones = data.ones.reverse()
let tens = data.tens.reverse()
let hundreds = data.hundreds.reverse()

let multiples = [
  [1000000, 'millón',],
  [1000, 'mil',],
  // [100, 'cent'],
  [1, 'one'],
]

//turn number into an array of magnitudes, like [[5, million], [2, hundred]]
const getMagnitudes = function (num) {
  let working = num
  let have = []
  multiples.forEach(a => {
    if (num >= a[0]) {
      let howmany = Math.floor(working / a[0])
      working -= howmany * a[0]
      if (howmany) {
        have.push({
          unit: a[1],
          num: howmany,
        })
      }
    }
  })
  return have
}

const twoDigit = function (num) {
  let words = []
  let addAnd = false
  // 100-900
  for (let i = 0; i < hundreds.length; i += 1) {
    if (hundreds[i][0] <= num) {
      words.push(hundreds[i][1])
      num -= hundreds[i][0]
      break
    }
  }
  // 30-90
  for (let i = 0; i < tens.length; i += 1) {
    if (tens[i][0] <= num) {
      words.push(tens[i][1])
      num -= tens[i][0]
      addAnd = true
      break
    }
  }
  if (num === 0) {
    return words
  }
  // 0-29
  for (let i = 0; i < ones.length; i += 1) {
    if (ones[i][0] <= num) {
      // 'y dos'
      if (words.length > 0 && addAnd) {
        words.push('y')
      }
      words.push(ones[i][1])
      num -= ones[i][0]
      break
    }
  }
  return words
}

const toText = function (num) {
  if (num === 0) {
    return ['cero']
  }
  if (num === 100) {
    return ['cien']
  }
  let words = []
  if (num < 0) {
    words.push('moins')
    num = Math.abs(num)
  }
  // handle multiples
  let found = getMagnitudes(num)
  found.forEach(obj => {
    let res = twoDigit(obj.num)
    words = words.concat(res)
    if (obj.unit !== 'one') {
      words.push(obj.unit)
    }
  })
  // console.log(num)
  return words
}
export default toText