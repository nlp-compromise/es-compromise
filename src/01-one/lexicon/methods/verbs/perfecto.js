import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'

let { perfecto } = model

// =-=-
let m = {
  fromPerfecto: reverse(perfecto.perfecto),
  toPerfecto: perfecto.perfecto,
}

const fromPerfecto = function (str) {
  return convert(str, m.fromPerfecto)
}
const toPerfecto = function (str) {
  return convert(str, m.toPerfecto)
}


export { fromPerfecto, toPerfecto }
