const guessGender = function (str) {
  return 'm'
}

// deduce gender of an adjective, but it's suffix
const guessAdjGender = function (terms, i, world) {
  const setTag = world.methods.one.setTag
  let term = terms[i]
  if (term.tags.has('Adjective') && !term.tags.has('FemaleAdjective') && !term.tags.has('MaleAdjective')) {
    let str = term.machine || term.normal
    if (guessGender(str) === 'f') {
      setTag([term], 'FemaleNoun', world, false, '3-guessGender')
    } else {
      setTag([term], 'MaleNoun', world, false, '3-guessGender')
    }
  }
}
export default guessAdjGender