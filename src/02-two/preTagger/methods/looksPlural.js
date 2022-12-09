
let exceptions = {
  análisis: false,
  jueves: false,
  ciempiés: false,
}

const looksPlural = function (str) {
  // not long enough to be plural
  if (!str || str.length <= 3) {
    return false
  }
  // 'menus' etc
  if (exceptions.hasOwnProperty(str)) {
    return exceptions[str]
  }
  if (str.endsWith('s')) {
    return true
  }
  return false
}
export default looksPlural