import { convert, reverse, uncompress } from 'suffix-thumb'
import model from './_data.js'

// uncompress them
Object.keys(model).forEach(k => {
  Object.keys(model[k]).forEach(form => {
    model[k][form] = uncompress(model[k][form])
  })
})
let { presentTense, pastTense, futureTense, conditional } = model

// =-=-
const revAll = function (m) {
  return Object.keys(m).reduce((h, k) => {
    h[k] = reverse(m[k])
    return h
  }, {})
}

let presentRev = revAll(presentTense)
let pastRev = revAll(pastTense)
let futureRev = revAll(futureTense)
let conditionalRev = revAll(conditional)

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
const fromPresent = (str) => doEach(str, presentRev)

const toPast = (str) => doEach(str, pastTense)
const fromPast = (str) => doEach(str, pastRev)

const toFuture = (str) => doEach(str, futureTense)
const fromFuture = (str) => doEach(str, futureRev)

const toConditional = (str) => doEach(str, conditional)
const fromConditional = (str) => doEach(str, conditionalRev)


export default {
  toPresent, fromPresent,
  toPast, fromPast,
  toFuture, fromFuture,
  toConditional, fromConditional
}