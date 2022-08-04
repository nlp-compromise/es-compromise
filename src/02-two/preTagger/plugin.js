import preTagger from './compute/index.js'
import model from './model/index.js'
import methods from './methods/index.js'


export default {
  compute: {
    preTagger
  },
  model: {
    two: model
  },
  methods,
  hooks: ['preTagger']
}