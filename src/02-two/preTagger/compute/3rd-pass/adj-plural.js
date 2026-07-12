// deduce plurality of an adjective, by its suffix
const guessAdjPlural = function (terms, i, world) {
  const setTag = world.methods.one.setTag
  const looksPlural = world.methods.two.looksPlural
  let term = terms[i]
  if (term.tags.has('Adjective') && !term.tags.has('SingularAdjective') && !term.tags.has('PluralAdjective')) {
    let str = term.machine || term.normal
    if (looksPlural(str) === true) {
      setTag([term], 'PluralAdjective', world, false, '3-guessPlural')
    } else {
      setTag([term], 'SingularAdjective', world, false, '3-guessPlural')
    }
  }
}
export default guessAdjPlural
