// import nlp from 'compromise/one'
import nlp from '/Users/spencer/mountain/compromise/src/one.js'
import lexicon from './01-one/lexicon/plugin.js'
import tokenizer from './01-one/tokenizer/plugin.js'
import preTagger from './02-two/preTagger/plugin.js'
import postTagger from './02-two/postTagger/plugin.js'
import tagset from './01-one/tagset/plugin.js'
import numbers from './03-three/numbers/plugin.js'
import nouns from './03-three/nouns/plugin.js'
import adjectives from './03-three/adjectives/plugin.js'
import verbs from './03-three/verbs/plugin.js'
import version from './_version.js'

nlp.plugin(tokenizer)
nlp.plugin(tagset)
nlp.plugin(lexicon)
nlp.plugin(preTagger)
nlp.plugin(postTagger)
nlp.plugin(nouns)
nlp.plugin(adjectives)
nlp.plugin(verbs)
nlp.plugin(numbers)


const es = function (txt, lex) {
  return nlp(txt, lex)
}

// copy constructor methods over
Object.keys(nlp).forEach(k => {
  if (nlp.hasOwnProperty(k)) {
    es[k] = nlp[k]
  }
})

es.world = () => nlp.world()
// de.model = () => nlp.model()
// de.methods = () => nlp.methods()
// de.hooks = () => nlp.hooks()
// de.plugin = (plg) => nlp.plugin(plg)
// de.buildNet = (matches) => nlp.buildNet(matches)

/** log the decision-making to console */
es.verbose = function (set) {
  let env = typeof process === 'undefined' ? self.env || {} : process.env //use window, in browser
  env.DEBUG_TAGS = set === 'tagger' || set === true ? true : ''
  env.DEBUG_MATCH = set === 'match' || set === true ? true : ''
  env.DEBUG_CHUNKS = set === 'chunker' || set === true ? true : ''
  return this
}

es.version = version

export default es