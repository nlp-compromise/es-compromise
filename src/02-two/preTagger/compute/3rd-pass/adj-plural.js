const isPlural = function (str) {
  if (str.endsWith('s') && !str.endsWith('és')) {
    return true
  }
  return false
}

// deduce gender of an adjective, but it's suffix
const guessAdjPlural = function (terms, i, world) {
  const setTag = world.methods.one.setTag
  let term = terms[i]
  if (term.tags.has('Adjective') && !term.tags.has('SingularAdjective') && !term.tags.has('PluralAdjective')) {
    let str = term.machine || term.normal
    if (isPlural(str) === true) {
      setTag([term], 'PluralAdjective', world, false, '3-guessPlural')
    } else {
      setTag([term], 'SingularAdjective', world, false, '3-guessPlural')
    }
  }
}
export default guessAdjPlural
