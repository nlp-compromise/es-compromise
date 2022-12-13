import { convert } from 'suffix-thumb'
import model from '../models.js'
import { toGerund } from './gerund.js'
import { toReflexive } from './reflexive.js'
let { presentTense, pastTense, futureTense, conditional, subjunctive, imperative } = model

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
const noFirst = function (str, m) {
  let obj = doEach(str, m)
  obj.first = ''
  obj.firstPlural = ''
  return obj
}

const toPresent = (str) => doEach(str, presentTense)
const toPast = (str) => doEach(str, pastTense)
const toFuture = (str) => doEach(str, futureTense)
const toSubjunctive = (str) => doEach(str, subjunctive)
const toConditional = (str) => doEach(str, conditional)
const toImperative = (str) => noFirst(str, imperative)

// an array of every inflection, for '{inf}' syntax
const all = function (str) {
  let res = [str].concat(
    Object.values(toPresent(str)),
    Object.values(toPast(str)),
    Object.values(toFuture(str)),
    Object.values(toConditional(str)),
    toGerund(str),
    toReflexive(str),
  ).filter(s => s)
  res = new Set(res)
  return Array.from(res)
}

export {
  all,
  toPresent,
  toPast,
  toFuture,
  toConditional,
  toSubjunctive,
  toImperative
}
