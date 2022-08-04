import unicode from './unicode.js'
import contractions from './contractions.js'


export default {
  mutate: (world) => {
    world.model.one.unicode = unicode

    world.model.one.contractions = contractions

    // 'que' -> 'quebec'
    delete world.model.one.lexicon.que
  }
}