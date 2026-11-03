// deduce plurality of a noun, by its suffix
const guessPlural = function (terms, i, world) {
  const setTag = world.methods.one.setTag
  const looksPlural = world.methods.two.looksPlural
  const term = terms[i]
  if (term.tags.has('Noun') && !term.tags.has('Singular') && !term.tags.has('Plural') && !term.tags.has('Pronoun')) {
    const str = term.machine || term.normal
    if (looksPlural(str)) {
      setTag([term], 'Plural', world, false, '3-guessPlural')
    }
  }
}
export default guessPlural
