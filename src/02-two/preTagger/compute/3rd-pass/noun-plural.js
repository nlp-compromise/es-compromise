const isPlural = function (str) {
  if (str.endsWith('s')) {
    return true
  }
  return false
}

// deduce gender of a noun, but it's suffix
const guessPlural = function (terms, i, world) {
  const setTag = world.methods.one.setTag
  let term = terms[i]
  if (term.tags.has('Noun') && !term.tags.has('Singular') && !term.tags.has('Plural') && !term.tags.has('Pronoun')) {
    let str = term.machine || term.normal
    let found = isPlural(str)
    if (found) {
      setTag([term], 'Plural', world, false, '3-guessPlural')
    }
  }
}
export default guessPlural