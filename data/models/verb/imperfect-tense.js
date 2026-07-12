import presentTense from './present-tense.js'

// pretérito imperfecto - 'yo hablaba', 'ella comía'
// fully regular except ser/ir/ver, so we can generate it
// from the same verb-inventory as the other tenses.
const arEndings = ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban']
const erEndings = ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían']

const irregular = {
  ser: ['era', 'eras', 'era', 'éramos', 'erais', 'eran'],
  ir: ['iba', 'ibas', 'iba', 'íbamos', 'ibais', 'iban'],
  ver: ['veía', 'veías', 'veía', 'veíamos', 'veíais', 'veían'],
}

let data = {}
Object.keys(presentTense).forEach(inf => {
  // reflexive keys store plain conjugations, like the other files
  let stem = inf.replace(/se$/, '')
  if (irregular.hasOwnProperty(stem)) {
    data[inf] = irregular[stem]
    return
  }
  let m = stem.match(/(ar|er|ir|ír)$/)
  if (!m) {
    return
  }
  let root = stem.slice(0, stem.length - 2)
  let ends = m[0] === 'ar' ? arEndings : erEndings
  data[inf] = ends.map(e => root + e)
})

export default data
