import conjugate from './verbs/conjugate.js'
import toRoot from './verbs/toRoot.js'
import nouns from './nouns/index.js'
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
    toPlural: nouns.toPlural,
    toSingular: nouns.fromPlural,
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
