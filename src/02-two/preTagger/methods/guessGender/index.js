import suffixes from './suffixes.js'
import exceptions from './exceptions.js'

//sweep-through all suffixes
const bySuffix = function (str) {
  const len = str.length
  let max = 7
  if (len <= max) {
    max = len - 1
  }
  for (let i = max; i > 1; i -= 1) {
    let suffix = str.substr(len - i, len)
    if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
      // console.log(suffix)
      let tag = suffixes[suffix.length][suffix]
      return tag
    }
  }
  return null
}

const guessGender = function (str) {
  if (exceptions.f.has(str)) {
    return 'f'
  }
  if (exceptions.m.has(str)) {
    return 'm'
  }
  return bySuffix(str)
}
export default guessGender

