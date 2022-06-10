import conjugate from './verbs/conjugate.js'
import toRoot from './verbs/toRoot.js'
import toSingular from './nouns/toSingular.js'
import toPlural from './nouns/toPlural.js'
import toMasculine from './nouns/toMasculine.js'
import { adjToMasculine, adjToSingular } from './adjectives/toRoot.js'
import { fromGerund, toGerund } from './verbs/gerund.js'


export default {
  verb: {
    conjugate,
    toRoot,
    fromGerund,
    toGerund
  },
  noun: {
    toPlural,
    toSingular,
    toMasculine,
  },
  adjective: {
    adjToMasculine,
    adjToSingular
  }
}
