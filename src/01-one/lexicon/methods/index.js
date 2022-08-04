import conjugate from './verbs/conjugate.js'
import toRoot from './verbs/toRoot.js'
import toSingular from './nouns/toSingular.js'
import nounToPlural from './nouns/toPlural.js'
import toMasculine from './nouns/toMasculine.js'
import { toFemale, toPlural, toFemalePlural, fromFemale, fromPlural, fromFemalePlural } from './adjectives/index.js'
import { fromGerund, toGerund } from './verbs/gerund.js'

export default {
  verb: {
    conjugate,
    toRoot,
    fromGerund,
    toGerund
  },
  noun: {
    toPlural: nounToPlural,
    toSingular,
    toMasculine,
  },
  adjective: {
    toFemale,
    toPlural,
    toFemalePlural,
    fromFemale,
    fromPlural,
    fromFemalePlural,
  }
}
