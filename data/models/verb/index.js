
import presentTense from './present-tense.js'
import pastTense from './past-tense.js'
import imperfectTense from './imperfect-tense.js'
import futureTense from './future-tense.js'
import conditional from './conditional.js'
import subjunctive from './subjunctive.js'
import imperfectSubjunctive from './imperfect-subjunctive.js'
import imperative from './imperative.js'

const vbOrder = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural']
// the imperative file's columns are laid out [_, tú, vosotros, _, usted, ustedes]
const impOrder = ['first', 'second', 'secondPlural', 'firstPlural', 'third', 'thirdPlural']
const todo = {
  presentTense: { data: presentTense, keys: vbOrder },
  pastTense: { data: pastTense, keys: vbOrder },
  imperfectTense: { data: imperfectTense, keys: vbOrder },
  futureTense: { data: futureTense, keys: vbOrder },
  conditional: { data: conditional, keys: vbOrder },
  subjunctive: { data: subjunctive, keys: vbOrder },
  imperfectSubjunctive: { data: imperfectSubjunctive, keys: vbOrder },
  imperative: { data: imperative, keys: impOrder },
}

// turn our conjugation data into word-pairs
let model = {}
Object.keys(todo).forEach(k => {
  model[k] = {}
  let { data, keys } = todo[k]
  keys.forEach((form, i) => {
    let pairs = []
    Object.keys(data).forEach(inf => {
      pairs.push([inf, data[inf][i]])
    })
    model[k][form] = pairs
    // console.log(k, form, pairs.length)
  })
})

export default model
