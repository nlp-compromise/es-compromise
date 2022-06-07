// these are easy
const guessGender = function (str) {
  if (str.endsWith('o') || str.endsWith('os')) {
    return 'm'
  }
  if (str.endsWith('a') || str.endsWith('as')) {
    return 'f'
  }
  return 'm'
}

// deduce gender of an adjective, but it's suffix
const guessAdjGender = function (terms, i, world) {
  const setTag = world.methods.one.setTag
  let term = terms[i]
  if (term.tags.has('Adjective') && !term.tags.has('FemaleAdjective') && !term.tags.has('MaleAdjective')) {
    let str = term.machine || term.normal
    if (guessGender(str) === 'f') {
      setTag([term], 'FemaleAdjective', world, false, '3-guessGender')
    } else {
      setTag([term], 'MaleAdjective', world, false, '3-guessGender')
    }
  }
}
export default guessAdjGender

// import list from '/Users/spencer/mountain/es-compromise/data/models/adjectives.js'
// let count = 0
// list.forEach(a => {
//   let [m, f, mp, fp] = a
//   if (guessGender(fp) !== 'f') {
//     console.log(fp)
//     count += 1
//   }
// })
// console.log(count)