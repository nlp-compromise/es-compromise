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
const fromPlural = (str) => convert(str, mpRev)
const fromFemalePlural = (str) => convert(str, fpRev)

export default {
  toFemale,
  toPlural,
  toFemalePlural,
  fromFemale,
  fromPlural,
  fromFemalePlural,
}
// console.log(toFemale("principesco") === "principesca")
// console.log(fromFemale("principesca") === "principesco")
// console.log(toPlural("principesco") === "principescos")
// console.log(fromPlural("principescos") === "principesco")