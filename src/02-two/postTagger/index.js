import matches from './matches.js'
let net = null

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
  // view.cache()
  return view
}
export default postTagger