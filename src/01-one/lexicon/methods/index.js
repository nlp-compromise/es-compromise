import { toPresent, toPast, toFuture, toConditional } from './verbs/tense.js'
import { fromPresent, fromPast, fromFuture, fromConditional } from './verbs/toRoot.js'
import nouns from './nouns/index.js'
import toMasculine from './nouns/toMasculine.js'
import adjective from './adjectives/index.js'
import { fromGerund, toGerund } from './verbs/gerund.js'

export default {
  verb: {
    fromGerund, fromPresent, fromPast, fromFuture, fromConditional,
    toPresent, toPast, toFuture, toConditional, toGerund,
  },
  noun: {
    toPlural: nouns.toPlural,
    toSingular: nouns.fromPlural,
    toMasculine,
  },
  adjective,
}
