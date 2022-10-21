import test from 'tape'
import nlp from '../_lib.js'
let here = '[number-parse] '
nlp.verbose(false)

let arr = [
  [1, 'uno', 'primero'],
  [2, 'dos', 'segundo'],
  [3, 'tres', 'tercero'],
  [4, 'cuatro', 'cuarto'],
  [5, 'cinco', 'quinto'],
  [6, 'seis', 'sexto'],
  [7, 'siete', 'sétimo'],
  [8, 'ocho', 'octavo'],
  [9, 'nueve', 'noveno'],
  [10, 'diez', 'décimo'],
  [11, 'once', 'undécimo'],
  [12, 'doce', 'duodécimo'],
  [13, 'trece', 'decimotercero'],
  [14, 'catorce', 'decimocuarto'],
  [15, 'quince', 'decimoquinto'],
  [16, 'dieciséis', 'decimosexto'],
  [17, 'diecisiete', 'decimoséptimo'],
  [18, 'dieciocho', 'decimoctavo'],
  [19, 'diecinueve', 'decimonoveno'],
  [20, 'veinte', 'vigésimo'],//20th
  [21, 'veintiuno', 'vigésimo primero'],//21st
  [22, 'veintidós', 'vigésimo segundo'],//22nd
  [23, 'veintitrés', 'vigésimo tercero'],//23rd
  [24, 'veinticuatro', 'vigésimo cuarto'],//24th
  [25, 'veinticinco', 'vigésimo quinto'],
  [26, 'veintiséis', 'vigésimo sexto'],
  [27, 'veintisiete', 'vigésimo sétimo'],
  [28, 'veintiocho', 'vigésimo octavo'],
  [29, 'veintinueve', 'vigésimo noveno'],
  [30, 'treinta', 'trigésimo'],
  [40, 'cuarenta', 'cuadragésimo'],
  [50, 'cincuenta', 'quincuagésimo'],
  [60, 'sesenta', 'sexagésimo'],
  [70, 'setenta', 'septuagésimo'],
  [80, 'ochenta', 'octogésimo'],
  [90, 'noventa', 'nonagésimo'],
  [100, 'cien', 'centésimo'],
  [200, 'doscientos', 'ducentésimo'],
  [300, 'trescientos', 'tricentésimo'],
  [400, 'cuatrocientos', 'cuadringentésimo'],
  [500, 'quinientos', 'quingentésimo'],
  [600, 'seiscientos', 'sexcentésimo'],
  [700, 'setecientos', 'septingentésimo'],
  [800, 'ochocientos', 'octingésimo'],
  [900, 'novecientos', 'noningentésimo'],
  [1000, 'mil', 'milésimo'],
  [1000000, 'millón', 'millonésima'],

  [24, '24', '24°'],
  [17, '17', '17°'],
  [107, '107', '107°']
]

test('toOrdinal:', function (t) {
  arr.forEach(a => {
    let [_, card, ord] = a
    let doc = nlp(card)
    let n = doc.numbers().toOrdinal()
    t.equal(doc.text(), ord, here + ' [toOrdinal] ' + card)
  })
  t.end()
})

test('toCardinal:', function (t) {
  arr.forEach(a => {
    let [_, card, ord] = a
    let doc = nlp(ord)
    let n = doc.numbers().toCardinal()
    t.equal(doc.text(), card, here + ' [toCardinal] ' + card)
  })
  t.end()
})

