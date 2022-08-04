import lexData from './_data.js'
import { unpack } from 'efrt'
import conjugate from './methods/verbs/conjugate.js'
import misc from './misc.js'


let lexicon = misc


const tagMap = {
  first: 'FirstPerson',
  second: 'SecondPerson',
  third: 'ThirdPerson',
  firstPlural: 'FirstPersonPlural',
  secondPlural: 'SecondPersonPlural',
  thirdPlural: 'ThirdPersonPlural',
}

const addWords = function (obj, tag, lex) {

  Object.keys(obj).forEach(k => {
    let w = obj[k]
    if (!lex[w]) {
      lex[w] = [tag, tagMap[k]]
    }
  })
}

Object.keys(lexData).forEach(tag => {
  let wordsObj = unpack(lexData[tag])
  Object.keys(wordsObj).forEach(w => {
    lexicon[w] = tag

    // add conjugations for our verbs
    if (tag === 'Infinitive') {
      // add present tense
      let obj = conjugate.toPresent(w)
      addWords(obj, 'PresentTense', lexicon)
      // add past tense
      obj = conjugate.toPast(w)
      addWords(obj, 'PastTense', lexicon)
      // add future tense
      obj = conjugate.toFuture(w)
      addWords(obj, 'FutureTense', lexicon)
      // add conditional
      obj = conjugate.toConditional(w)
      addWords(obj, 'Conditional', lexicon)
    }
    if (tag === 'Cardinal') {
      lexicon[w] = ['Cardinal', 'TextValue']
    }
    if (tag === 'Ordinal') {
      lexicon[w] = ['Ordinal', 'TextValue']
    }
  })
})
// console.log(lexicon['llorar'])

export default lexicon