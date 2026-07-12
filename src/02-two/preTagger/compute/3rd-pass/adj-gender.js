// only -o/-a adjectives are gendered.
// '-e' and consonant endings are common-gender ('grande', 'feliz', 'azul')
const guessGender = function (str) {
  if (str.endsWith('o') || str.endsWith('os')) {
    return 'm'
  }
  if (str.endsWith('a') || str.endsWith('as')) {
    return 'f'
  }
  return null
}

// deduce gender of an adjective, by its suffix
const guessAdjGender = function (terms, i, world) {
  const setTag = world.methods.one.setTag
  let term = terms[i]
  if (term.tags.has('Adjective') && !term.tags.has('FemaleAdjective') && !term.tags.has('MaleAdjective')) {
    let str = term.machine || term.normal
    let found = guessGender(str)
    if (found === 'f') {
      setTag([term], 'FemaleAdjective', world, false, '3-guessGender')
    } else if (found === 'm') {
      setTag([term], 'MaleAdjective', world, false, '3-guessGender')
    }
  }
}
export default guessAdjGender
