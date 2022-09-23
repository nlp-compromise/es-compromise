import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'

let pRev = reverse(model.nouns.plurals)

const toPlural = (str) => convert(str, model.nouns.plurals)
const fromPlural = (str) => convert(str, pRev)

export default {
  toPlural,
  fromPlural,
}
// console.log(toFemale("principesco") === "principesca")
// console.log(fromFemale("principesca") === "principesco")
// console.log(toPlural("principesco") === "principescos")
// console.log(fromPlural("principescos") === "principesco")
// console.log(fromPlural("sombras") === "sombra")