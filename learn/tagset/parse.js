// https://www.cs.upc.edu/~nlp/wikicorpus/
const file = `/Users/spencer/data/tagged.es/spanishEtiquetado_15000_20000`
import fs from 'fs'

let lines = fs.readFileSync(file, 'latin1').toString().split(/\n/)
let out = []
let tmp = []

const mapping = {
  A: 'Adjective,',
  C: 'Conjunction,',
  D: 'Determiner',
  N: 'Noun',
  P: 'Pronoun',
  V: 'Verb',
  I: 'Interjection',
  W: 'Date',
  Z: 'Number',
  R: 'Adverb',
  S: 'Adposition',
  F: 'Punctuation',
}
// https://freeling-user-manual.readthedocs.io/en/latest/tagsets/
const parseTag = function (str = '') {
  let c = str.substring(0, 1)
  return mapping[c]
}

lines.forEach(line => {
  if (!line) {
    let txt = tmp.map(t => t.txt).join(' ')
    txt = txt.replace(/ (\)|"|,|:|;) g/, '$1 ')
    txt = txt.replace(/ \( /g, ' (')
    txt = txt.replace(/ .$/, '.')
    tmp = tmp.filter(t => t.txt !== ',' && t.txt !== '.')
    out.push({ txt, words: tmp })
    tmp = []
    return
  }
  let a = line.split(/ /g)
  tmp.push({
    txt: (a[0] || '').replace(/_/g, ' '),
    lemma: (a[1] || '').replace(/_/g, ' '),
    tag: parseTag(a[2]),
    sense: a[3]
  })
})
console.log(out.length)
console.log(out[1224])