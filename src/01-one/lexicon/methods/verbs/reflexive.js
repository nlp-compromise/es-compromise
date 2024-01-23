// generate all reflexive forms of this verb
const toReflexive = function (str) {
  return {
    first: str + 'me',
    firstPlural: str + 'nos',
    second: str + 'te',
    secondPlural: str + 'os',
    third: str + 'se',
    thirdPlural: str + 'se'
  }
}

const stripReflexive = function (str) {
  str = str.replace(/(me|nos|te|os|se)$/, '') // 🤞
  return str
}
export { toReflexive, stripReflexive }
