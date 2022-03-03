// https://www.cs.upc.edu/~nlp/wikicorpus/
const path = `/Users/spencer/data/tagged.es`
import fs from 'fs'

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
  let from = 10000 + (num * 5000)
  const file = `${path}/spanishEtiquetado_${from}_${from + 5000}`

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