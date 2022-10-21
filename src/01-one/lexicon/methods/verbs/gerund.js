import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'

let { gerunds } = model
// =-=-
let m = {
  fromGerund: reverse(gerunds.gerunds),
  toGerund: gerunds.gerunds,
}

const fromGerund = function (str) {
  return convert(str, m.fromGerund)
}
const toGerund = function (str) {
  return convert(str, m.toGerund)
}


export { fromGerund, toGerund }
