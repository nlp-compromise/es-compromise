import conjugate from './verbs/conjugate.js'
import toRoot from './verbs/toRoot.js'
import toSingular from './nouns/toSingular.js'
import toPlural from './nouns/toPlural.js'


export default {
  verb: {
    conjugate,
    toRoot
  },
  noun: {
    toPlural,
    toSingular,
  }
}
