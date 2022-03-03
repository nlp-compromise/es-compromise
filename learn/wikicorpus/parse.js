// https://www.cs.upc.edu/~nlp/wikicorpus/
const path = `/Users/spencer/data/tagged.es`
import fs from 'fs'

let files = [
  '10000_15000',
  '15000_20000',
  '20000_25000',
  '25000_30000',
  '40000_45000',
  '45000_50000',
  '70000_75000',
  '90000_95000',
  '110000_115000',
  '120000_125000',
  '180000_185000',
  '185000_190000',
  '200000_205000',
  '205000_210000',
  '210000_215000',
  '225000_230000',
  '230000_235000',
  '260000_265000',
  '265000_270000',
  '270000_275000',
  '285000_290000',
  '305000_310000',
  '310000_315000',
  '315000_320000',
  '320000_325000',
  '325000_330000',
  '330000_335000',
  '335000_340000',
  '340000_345000',
  '345000_350000',
  '350000_355000',
  '355000_360000',
  '360000_365000',
  '365000_370000',
  '370000_375000',
  '375000_380000',
  '380000_385000',
  '385000_390000',
  '390000_395000',
  '395000_400000',
  '400000_405000',
  '405000_410000',
  '410000_415000',
  '415000_420000',
  '420000_425000',
  '425000_430000',
  '430000_435000',
  '435000_440000',
  '440000_445000',
  '445000_450000',
  '450000_455000',
  '455000_460000',
  '460000_465000',
  '465000_470000',
  '470000_475000',
  '475000_480000',
  '480000_485000',
]

const mapping = {
  A: 'Adjective',
  C: 'Conjunction',
  D: 'Determiner',
  N: 'Noun',
  P: 'Pronoun',
  V: 'Verb',
  I: 'Interjection',
  W: 'Date',
  Z: 'Value',
  R: 'Adverb',
  S: 'Preposition',//'Adposition',
  F: 'Punctuation',
}
// https://freeling-user-manual.readthedocs.io/en/latest/tagsets/
const parseTag = function (str = '') {
  let c = str.substring(0, 1)
  return mapping[c]
}

const parse = function (num) {
  const file = `${path}/spanishEtiquetado_${files[num]}`

  let lines = fs.readFileSync(file, 'latin1').toString().split(/\n/)
  let out = []
  let tmp = []
  lines.forEach(line => {
    if (!line) {
      let txt = tmp.map(t => t.word).join(' ')
      txt = txt.replace(/ (\)|"|,|:|;) g/, '$1 ')
      txt = txt.replace(/ \( /g, ' (')
      txt = txt.replace(/ \.$/, '.')
      tmp = tmp.filter(t => t.tag !== 'Punctuation')
      out.push({ txt, words: tmp })
      tmp = []
      return
    }
    let a = line.split(/ /g)
    tmp.push({
      word: (a[0] || '').replace(/_/g, ' '),
      lemma: (a[1] || '').replace(/_/g, ' '),
      tag: parseTag(a[2]),
      sense: a[3]
    })
  })
  return out
}

// console.log(parse(2)[300])
export default parse