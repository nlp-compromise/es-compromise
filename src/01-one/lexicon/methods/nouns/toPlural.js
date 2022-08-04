import rules from './_rules.js'

const toPlural = function (str) {
  for (let i = 0; i < rules.length; i += 1) {
    let a = rules[i]
    if (str.endsWith(a[0])) {
      str = str.substr(0, str.length - a[0].length)
      str += a[1]
      return str
    }
  }
  return str + 's'
}
export default toPlural