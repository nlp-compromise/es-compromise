
// does this make any sense?
const toReflexive = function (str) {
  str = str.replace(/ar$/, 'arse')
  // str = str.replace(/ar$/, 'irte') //TODO:fixme
  // str = str.replace(/ar$/, 'arme')

  str = str.replace(/ir$/, 'irse')
  // str = str.replace(/ir$/, 'irte')

  str = str.replace(/er$/, 'erse')
  str = str.replace(/o$/, 'ose')
  return str
}

const fromReflexive = function (str) {
  str = str.replace(/arse$/, 'ar')
  str = str.replace(/arte$/, 'ir')
  str = str.replace(/arme$/, 'ar')

  str = str.replace(/irse$/, 'ir')
  str = str.replace(/irte$/, 'ir')

  str = str.replace(/erse$/, 'er')
  str = str.replace(/ose$/, 'o')
  return str
}
export { toReflexive, fromReflexive }