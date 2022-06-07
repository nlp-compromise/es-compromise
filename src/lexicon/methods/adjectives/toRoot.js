// adjective to masculine and to singular

const adjToSingular = function (str) {
  let arr = [
    ['ueses', 'ués'],
    ['eses', 'és'],
    ['ines', 'ín'],
    ['anes', 'án'],
    ['ores', 'or'],
    ['ones', 'ón'],
    ['es', ''],
    ['s', ''],
  ]
  for (let i = 0; i < arr.length; i += 1) {
    let [suff, repl] = arr[i]
    if (str.endsWith(suff)) {
      str = str.substr(0, str.length - suff.length)
      return str += repl
    }
  }
  return str
}

const adjToMasculine = function (str) {
  let arr = [
    ['onas', 'ones'],
    ['uesas', 'ueses'],
    ['nota', 'note'],
    ['esa', 'és'],
    ['ona', 'ón'],
    ['oras', 'ores'],
    ['ora', 'or'],
    ['as', 'os'],
    ['a', 'o'],
  ]
  for (let i = 0; i < arr.length; i += 1) {
    let [suff, repl] = arr[i]
    if (str.endsWith(suff)) {
      str = str.substr(0, str.length - suff.length)
      return str += repl
    }
  }
  return str
}

export { adjToMasculine, adjToSingular }

// import list from '/Users/spencer/mountain/es-compromise/data/models/adjectives.js'
// let count = 0
// list.forEach(a => {
//   let [m, f, mp, fp] = a
//   if (toMasculine(f) !== m) {
//     count += 1
//     console.log(f, m, '  -  ', toMasculine(f))
//   }
// })
// console.log(count)

// monteses montés monté
// console.log(toSingular('monteses'))