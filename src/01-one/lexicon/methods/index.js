import { toPresent, toPast, toFuture, toConditional, all as allAdj } from './verbs/tense.js'
import { fromPresent, fromPast, fromFuture, fromConditional } from './verbs/toRoot.js'
import { toPlural, toSingular } from './nouns/index.js'
import toMasculine from './nouns/toMasculine.js'
import adjective from './adjectives/index.js'
import { fromGerund, toGerund } from './verbs/gerund.js'

export default {
  verb: {
    fromGerund, fromPresent, fromPast, fromFuture, fromConditional,
    toPresent, toPast, toFuture, toConditional, toGerund,
    all: allAdj,
  },
  noun: {
    toPlural,
    toSingular,
    toMasculine,
    all: toPlural
  },
  adjective,
}
