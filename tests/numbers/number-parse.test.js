import test from 'tape'
import nlp from '../_lib.js'
let here = '[number-parse] '
nlp.verbose(false)

let arr = [
  [1, 'uno'],
  [2, 'dos'],
  [3, 'tres'],
  [4, 'cuatro'],
  [5, 'cinco'],
  [6, 'seis'],
  [7, 'siete'],
  [8, 'ocho'],
  [9, 'nueve'],
  [10, 'diez'],
  [11, 'once'],
  [12, 'doce'],
  [13, 'trece'],
  [14, 'catorce'],
  [15, 'quince'],
  [16, 'dieciséis'],
  [17, 'diecisiete'],
  [18, 'dieciocho'],
  [19, 'diecinueve'],
  [20, 'veinte'],
  [21, 'veintiuno'],
  [22, 'veintidós'],
  [23, 'veintitrés'],
  [24, 'veinticuatro'],
  [25, 'veinticinco'],
  [26, 'veintiséis'],
  [27, 'veintisiete'],
  [28, 'veintiocho'],
  [29, 'veintinueve'],
  [30, 'treinta'],
  [31, 'treinta y uno'],
  [32, 'treinta y dos'],
  [33, 'treinta y tres'],
  [40, 'cuarenta'],
  [41, 'cuarenta y uno'],
  [42, 'cuarenta y dos'],
  [50, 'cincuenta'],
  [60, 'sesenta'],
  [70, 'setenta'],
  [80, 'ochenta'],
  [90, 'noventa'],
  [100, 'cien'],
  [101, 'ciento uno'],
  [102, 'ciento dos'],
  [110, 'ciento diez'],
  [111, 'ciento once'],
  [200, 'doscientos'],
  [201, 'doscientos uno'],
  [202, 'doscientos dos'],
  [211, 'doscientos once'],
  [276, 'doscientos setenta y seis'],
  [300, 'trescientos'],
  [400, 'cuatrocientos'],
  [500, 'quinientos'],
  [600, 'seiscientos'],
  [700, 'setecientos'],
  [800, 'ochocientos'],
  [900, 'novecientos'],
  [1000, 'mil'],
  [1011, 'mil once'],
  [1111, 'mil ciento once'],
  [2000, 'dos mil'],
  [3000003, 'tres millones tres'],
  [31, 'treinta y uno'],
  [32, 'treinta y dos'],
  [33, 'treinta y tres'],
  [34, 'treinta y cuatro'],
  [35, 'treinta y cinco'],
  [36, 'treinta y seis'],
  [37, 'treinta y siete'],
  [38, 'treinta y ocho'],
  [39, 'treinta y nueve'],
  [40, 'cuarenta'],
  [41, 'cuarenta y uno'],
  [42, 'cuarenta y dos'],
  [43, 'cuarenta y tres'],
  [44, 'cuarenta y cuatro'],
  [45, 'cuarenta y cinco'],
  [46, 'cuarenta y seis'],
  [47, 'cuarenta y siete'],
  [48, 'cuarenta y ocho'],
  [49, 'cuarenta y nueve'],
  [50, 'cincuenta'],
  [81, 'ochenta y uno'],
  [82, 'ochenta y dos'],
  [83, 'ochenta y tres'],
  [84, 'ochenta y cuatro'],
  [85, 'ochenta y cinco'],
  [86, 'ochenta y seis'],
  [87, 'ochenta y siete'],
  [88, 'ochenta y ocho'],
  [89, 'ochenta y nueve'],
  [90, 'noventa'],
  [43, 'cuarenta y tres'],
  [55, 'cincuenta y cinco'],
  [62, 'sesenta y dos'],
  [79, 'setenta y nueve'],
  [84, 'ochenta y cuatro'],
  [98, 'noventa y ocho'],
  [1000000, 'un millón'],
  [2000000, 'dos millón'],
  [100000000, 'cien millones'],



  [120, 'ciento veinte'],
  [121, 'ciento veintiuno'],
  [122, 'ciento veintidós'],
  // [123, 'ciento veintitres'],
  [124, 'ciento veinticuatro'],
  [125, 'ciento veinticinco'],
  [202, 'doscientos dos'],
  [203, 'doscientos tres'],
  [204, 'doscientos cuatro'],
  [1000, 'mil'],
  [2000, 'dos mil'],
  [3000, 'tres mil'],
  [4000, 'cuatro mil'],
  [5000, 'cinco mil'],
  [6000, 'seis mil'],
  [7000, 'siete mil'],
  [8000, 'ocho mil'],
  [9000, 'nueve mil'],
  [10000, 'diez mil'],
  [100000, 'cien mil'],

  [79000, 'setenta y nueve mil'],
  [100000, 'cien mil'],
  [150000, 'ciento cincuenta mil'],
  [900000, 'novecientos mil'],
  [2000000, 'dos millones'],
  [40000000, 'cuarenta millones'],
  [561000000, 'quinientos sesenta y uno millones'],


]
test('number-parse:', function (t) {
  arr.forEach(a => {
    let [want, str] = a
    let doc = nlp(str)
    let n = doc.numbers().get()[0]
    t.equal(n, want, here + '[toNumber] ' + str)
  })
  t.end()
})

test('number-create:', function (t) {
  arr.forEach(a => {
    let [num, str] = a
    let doc = nlp(String(num))
    doc.numbers().toText()
    t.equal(doc.text(), str, here + '[toText] ' + num)
  })
  t.end()
})