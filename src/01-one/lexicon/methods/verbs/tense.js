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

const toPresent = (str) => doEach(str, presentTense)
const toPast = (str) => doEach(str, pastTense)
const toFuture = (str) => doEach(str, futureTense)
const toSubjunctive = (str) => doEach(str, subjunctive)
const toConditional = (str) => doEach(str, conditional)
const toImperative = (str) => {
  let obj = doEach(str, imperative)
  // imperative has no first-person
  // because ...you can't tell yourself to do something.
  obj.first = ''
  obj.firstPlural = ''
  return obj
}

// an array of every inflection, for '{inf}' syntax
const all = function (str) {
  let res = [str].concat(
    Object.values(toPresent(str)),
    Object.values(toPast(str)),
    Object.values(toFuture(str)),
    Object.values(toConditional(str)),
    Object.values(toImperative(str)),
    Object.values(toSubjunctive(str)),
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
