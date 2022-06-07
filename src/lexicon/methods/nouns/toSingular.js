import rules from './_rules.js'

const toSingular = function (str) {
  for (let i = 0; i < rules.length; i += 1) {
    let a = rules[i]
    if (str.endsWith(a[1])) {
      str = str.substr(0, str.length - a[1].length)
      str += a[0]
      return str
    }
  }
  if (str.endsWith('s')) {
    return str = str.substr(0, str.length - 1)
  }
  return str
}
export default toSingular

// console.log(toSingular('convoyes'))

// import list from '/Users/spencer/mountain/es-compromise/nouns.js'
// let count = 0
// list.forEach(a => {
//   let [m, f, mp, fp] = a
//   if (mp && m && f && fp) {
//     if (toSingular(mp) !== m) {
//       count += 1
//       console.log(mp, m)
//     }
//   }
// })
// console.log(count)
