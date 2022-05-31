import { convert } from 'suffix-thumb'
import model from './models.js'

let { presentTense, pastTense, futureTense, conditional } = model
// =-=-

const doEach = function (str, m) {
  return {
    first: convert(str, m.first),
    second: convert(str, m.second),
    third: convert(str, m.third),
    firstPlural: convert(str, m.firstPlural),
    secondPlural: convert(str, m.secondPlural),
    thirdPlural: convert(str, m.thirdPlural),
  }
}

const toPresent = (str) => doEach(str, presentTense)
const toPast = (str) => doEach(str, pastTense)
const toFuture = (str) => doEach(str, futureTense)
const toConditional = (str) => doEach(str, conditional)



export default {
  toPresent,
  toPast,
  toFuture,
  toConditional,
}