import lexicon from './lexicon.js'
import conjugate from './methods/conjugate.js'

export default {
  model: {
    one: {
      lexicon
    }
  },
  methods: {
    one: {
      transform: {
        conjugate
      }
    }
  },
}