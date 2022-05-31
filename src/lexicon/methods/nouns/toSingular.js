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