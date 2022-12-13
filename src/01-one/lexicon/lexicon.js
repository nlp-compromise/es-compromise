import lexData from './_data.js'
import { unpack } from 'efrt'
import methods from './methods/index.js'
import misc from './misc.js'

const { toPresent, toPast, toFuture, toConditional, toGerund, toPerfecto, toImperative, toSubjunctive } = methods.verb
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
      let obj = toPresent(w)
      addWords(obj, 'PresentTense', lexicon)
      // add past tense
      obj = toPast(w)
      addWords(obj, 'PastTense', lexicon)
      // add future tense
      obj = toFuture(w)
      addWords(obj, 'FutureTense', lexicon)
      // add conditional
      obj = toConditional(w)
      addWords(obj, 'Conditional', lexicon)
      // add gerund
      let str = toGerund(w)
      lexicon[str] = lexicon[str] || 'Gerund'
      // add perfecto
      str = toPerfecto(w)
      lexicon[str] = lexicon[str] || 'Perfecto'
      // add imperative
      obj = toImperative(w)
      addWords(obj, 'Imperative', lexicon)
      // add toSubjunctive
      obj = toSubjunctive(w)
      addWords(obj, 'Subjunctive', lexicon)
    }
    if (tag === 'Adjective') {
      let f = methods.adjective.toFemale(w)
      lexicon[f] = lexicon[f] || ['Adjective', 'FemaleAdjective', 'SingularAdjective']
      let fs = methods.adjective.toFemalePlural(w)
      lexicon[fs] = lexicon[fs] || ['Adjective', 'FemaleAdjective', 'PluralAdjective']
    }
    if (tag === 'Cardinal') {
      lexicon[w] = ['Cardinal', 'TextValue']
    }
    if (tag === 'Ordinal') {
      lexicon[w] = ['Ordinal', 'TextValue']
    }
  })
})
// console.log(lexicon['ganado'])

export default lexicon