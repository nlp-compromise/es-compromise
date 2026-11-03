const titleCase = /^\p{Lu}[\p{Ll}'’]/u
const hasNumber = /[0-9]/
const notProper = ['Date', 'Month', 'WeekDay', 'Unit', 'Expression']

const tagTitleCase = function (terms, index, world) {
  const setTag = world.methods.one.setTag
  const term = terms[index]
  const str = term.text || ''
  // titlecase and not first word of sentence
  if (index !== 0 && titleCase.test(str) === true && hasNumber.test(str) === false) {
    // skip Dates and stuff
    if (notProper.find((tag) => term.tags.has(tag))) {
      return
    }
    // first word in a quotation?
    if (/["']$/.test(term.pre)) {
      return
    }
    if (term.normal === 'the') {
      return
    }
    setTag([term], ['ProperNoun', 'Noun'], world, false, '2-titlecase')
  }
}
export default tagTitleCase
