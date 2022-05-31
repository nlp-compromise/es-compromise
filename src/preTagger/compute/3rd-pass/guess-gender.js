// deduce gender of a noun, but it's suffix
const guessNounGender = function (terms, i, world) {
  const setTag = world.methods.one.setTag
  const guessGender = world.methods.two.guessGender
  let term = terms[i]
  if (term.tags.has('Noun') && !term.tags.has('FemaleNoun') && !term.tags.has('MaleNoun') && !term.tags.has('Pronoun')) {
    let str = term.machine || term.normal
    let found = guessGender(str)
    if (found) {
      let tag = found === 'm' ? 'MaleNoun' : 'FemaleNoun'
      setTag([term], tag, world, false, '3-guessGender')
    }
  }
}
export default guessNounGender