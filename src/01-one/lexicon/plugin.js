import lexicon from './lexicon.js'
import methods from './methods/index.js'
import root from './compute/root.js'

export default {
  model: {
    one: {
      lexicon
    }
  },
  compute: { root: root },
  methods: {
    two: {
      transform: methods
    }
  },
}