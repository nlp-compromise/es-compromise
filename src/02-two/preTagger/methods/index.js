import bySuffix from './guessGender/index.js'
import quickSplit from './quickSplit.js'
import looksPlural from './looksPlural.js'


export default {
  two: {
    quickSplit,
    looksPlural,
    guessGender: bySuffix,
  }
}