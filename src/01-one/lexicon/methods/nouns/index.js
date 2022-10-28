import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'

let pRev = reverse(model.nouns.plurals)

const toPlural = (str) => convert(str, model.nouns.plurals)
const toSingular = (str) => convert(str, pRev)

const all = function (str) {
  let plur = toPlural(str)
  if (str === plur) {
    return [str]
  }
  return [str, plur]
}

export {
  toPlural, toSingular, all
}
// console.log(toFemale("principesco") === "principesca")
// console.log(fromFemale("principesca") === "principesco")
// console.log(toPlural("principesco") === "principescos")
// console.log(toSingular("principescos") === "principesco")
// console.log(toSingular("sombras") === "sombra")