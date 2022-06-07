const toMasculine = function (str) {
  let arr = [
    ['ieta', 'ieto'],
    ['erra', 'erro'],
    ['rica', 'rico'],
    ['esta', 'esto'],
    ['ueña', 'ueño'],
    ['lera', 'lero'],
    ['rata', 'rato'],
    ['uida', 'uido'],
    ['anda', 'ando'],
    ['uela', 'uelo'],
    ['desa', 'dés'],
    ['adas', 'ados'],
    ['oras', 'ores'],
    ['chas', 'chones'],
    ['amas', 'amones'],
    ['ica', 'ico'],
    ['iza', 'izo'],
    ['ona', 'ón'],
    ['ada', 'ado'],
    ['ora', 'or'],
    ['oga', 'ogo'],
    ['era', 'ero'],
    ['ana', 'ano'],
    ['iva', 'ivo'],
    ['ica', 'ico'],
    ['ina', 'ino'],
    ['ita', 'ito'],
    ['cia', 'ción'],
    ['ia', 'io'],
    ['ea', 'eo'],
    ['a', 'o'],
    ['as', 'os'],
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
export default toMasculine


// import list from '/Users/spencer/mountain/es-compromise/nouns.js'
// let count = 0
// list.forEach(a => {
//   let [m, f, ms, fs] = a
//   if (ms && fs) {
//     if (toMasculine(fs) !== ms) {
//       count += 1
//       console.log(fs, ms, '   ', toMasculine(fs))
//     }
//   }
// })
// console.log(count)

