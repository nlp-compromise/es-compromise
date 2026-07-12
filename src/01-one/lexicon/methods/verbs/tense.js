import { convert } from 'suffix-thumb'
import model from '../models.js'
import { toGerund } from './gerund.js'
import { toPerfecto } from './perfecto.js'
import { toReflexive } from './reflexive.js'
let { presentTense, pastTense, imperfectTense, futureTense, conditional, subjunctive, imperfectSubjunctive, imperative } = model

const doEach = function (str, m) {
  return {
    first: convert(str, m.first),
    second: convert(str, m.second),
    third: convert(str, m.third),
    firstPlural: convert(str, m.firstPlural),
    secondPlural: convert(str, m.secondPlural),
    thirdPlural: convert(str, m.thirdPlural)
  }
}

const toPresent = (str) => doEach(str, presentTense)
const toPast = (str) => doEach(str, pastTense)
const toImperfect = (str) => doEach(str, imperfectTense)
const toFuture = (str) => doEach(str, futureTense)
const toSubjunctive = (str) => doEach(str, subjunctive)
// 'si pudiera...' (-ra series)
const toImperfectSubjunctive = (str) => doEach(str, imperfectSubjunctive)
// 'si pudiese...' - the -se series is a regular respelling of the -ra one
const toImperfectSubjunctiveSe = (str) => {
  let obj = toImperfectSubjunctive(str)
  return {
    first: obj.first ? obj.first.replace(/ra$/, 'se') : obj.first,
    second: obj.second ? obj.second.replace(/ras$/, 'ses') : obj.second,
    third: obj.third ? obj.third.replace(/ra$/, 'se') : obj.third,
    firstPlural: obj.firstPlural ? obj.firstPlural.replace(/ramos$/, 'semos') : obj.firstPlural,
    secondPlural: obj.secondPlural ? obj.secondPlural.replace(/rais$/, 'seis') : obj.secondPlural,
    thirdPlural: obj.thirdPlural ? obj.thirdPlural.replace(/ran$/, 'sen') : obj.thirdPlural,
  }
}
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
  let res = [str]
    .concat(
      Object.values(toPresent(str)),
      Object.values(toPast(str)),
      Object.values(toImperfect(str)),
      Object.values(toFuture(str)),
      Object.values(toConditional(str)),
      Object.values(toImperative(str)),
      Object.values(toSubjunctive(str)),
      Object.values(toImperfectSubjunctive(str)),
      Object.values(toImperfectSubjunctiveSe(str)),
      Object.values(toReflexive(str)), //infinitive reflexive - 'quemarme'
      toGerund(str),
      toPerfecto(str)
    )
    .filter((s) => s)
  res = new Set(res)
  return Array.from(res)
}

export {
  all,
  toPresent,
  toPast,
  toImperfect,
  toFuture,
  toConditional,
  toSubjunctive,
  toImperfectSubjunctive,
  toImperfectSubjunctiveSe,
  toImperative
}
