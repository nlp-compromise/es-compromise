import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'

let { f, mp, fp } = model.adjectives

let fRev = reverse(f)
let mpRev = reverse(mp)
let fpRev = reverse(fp)

const toFemale = (str) => convert(str, f)
const toPlural = (str) => convert(str, mp)
const toFemalePlural = (str) => convert(str, fp)
const fromFemale = (str) => convert(str, fRev)
const toSingular = (str) => convert(str, mpRev)
const fromFemalePlural = (str) => convert(str, fpRev)

const all = function (str) {
  let arr = [str]
  arr.push(toFemale(str))
  arr.push(toPlural(str))
  arr.push(toFemalePlural(str))
  arr = arr.filter(s => s)
  arr = new Set(arr)
  return Array.from(arr)
}

export default {
  all,
  toFemale,
  toPlural,
  toFemalePlural,
  fromFemale,
  toSingular,
  fromFemalePlural,
}
// console.log(toFemale("principesco") === "principesca")
// console.log(fromFemale("principesca") === "principesco")
// console.log(toPlural("principesco") === "principescos")
// console.log(toSingular("principescos") === "principesco")