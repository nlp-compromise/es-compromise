import tagger from './compute/index.js'
import model from './model/index.js'
import methods from './methods/index.js'


export default {
  compute: {
    tagger
  },
  model: {
    two: model
  },
  methods,
  hooks: ['tagger']
}