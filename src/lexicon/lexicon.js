import lexData from './_data.js'
import { unpack } from 'efrt'
import conjugate from './methods/conjugate.js'


let lexicon = {}

Object.keys(lexData).forEach(tag => {
  let wordsObj = unpack(lexData[tag])
  Object.keys(wordsObj).forEach(w => {
    lexicon[w] = tag

    // add conjugations for our verbs
    if (tag === 'Infinitive') {
      // add present tense
      let pres = conjugate.toPresent(w)
      if (pres && pres !== w) {
        lexicon[pres] = 'PresentTense'
      }
      // add past tense
      let past = conjugate.toPast(w)
      if (past && past !== w) {
        lexicon[past] = 'PastTense'
      }
      // add future tense
      let past = conjugate.toFuture(w)
      if (past && past !== w) {
        lexicon[past] = 'FutureTense'
      }
      // add conditional
      let past = conjugate.toConditional(w)
      if (past && past !== w) {
        lexicon[past] = 'Verb'
      }
    }

  })
})
// console.log(lexicon)

export default lexicon