import { toPresent, toPast, toFuture, toConditional, toSubjunctive, toImperative, all as allAdj } from './verbs/tense.js'
import { fromPresent, fromPast, fromFuture, fromConditional, fromSubjunctive, fromImperative } from './verbs/toRoot.js'
import { toPlural, toSingular, all as allNoun } from './nouns/index.js'
import toMasculine from './nouns/toMasculine.js'
import adjective from './adjectives/index.js'
import { fromGerund, toGerund } from './verbs/gerund.js'
import { fromPerfecto, toPerfecto } from './verbs/perfecto.js'

export default {
  verb: {
    fromGerund, fromPresent, fromPast, fromFuture, fromConditional, fromSubjunctive, fromImperative,
    toPresent, toPast, toFuture, toConditional, toGerund, toSubjunctive, toImperative,
    fromPerfecto, toPerfecto,
    all: allAdj,
  },
  noun: {
    toPlural,
    toSingular,
    toMasculine,
    all: allNoun
  },
  adjective,
}
