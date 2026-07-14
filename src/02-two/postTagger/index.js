import matches from './matches.js'
import guessNounGender from '../preTagger/compute/3rd-pass/noun-gender.js'
let net = null

// rules like 'la-cura' flip a verb into a noun, after the preTagger's
// gender-pass already ran - so give those new nouns a gender here
const nounGender = function (view) {
  const world = view.world
  view.docs.forEach(terms => {
    for (let i = 0; i < terms.length; i += 1) {
      guessNounGender(terms, i, world)
    }
  })
}

const postTagger = function (view) {
  const { world } = view
  const { methods } = world
  // rebuild this only lazily
  net = net || methods.one.buildNet(matches, world)
  // perform these matches on a comma-seperated document
  let document = methods.two.quickSplit(view.document)
  let ptrs = document.map(terms => {
    let t = terms[0]
    return [t.index[0], t.index[1], t.index[1] + terms.length]
  })
  let m = view.update(ptrs)
  m.cache()
  m.sweep(net)
  view.uncache()
  nounGender(view)
  // view.cache()
  return view
}
export default postTagger