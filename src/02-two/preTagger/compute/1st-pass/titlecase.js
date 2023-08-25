const titleCase = /^\p{Lu}[\p{Ll}'’]/u
const hasNumber = /[0-9]/
const notProper = ['Date', 'Month', 'WeekDay', 'Unit', 'Expression']

const tagTitleCase = function (terms, index, world) {
  let setTag = world.methods.one.setTag
  let term = terms[index]
  let str = term.text || ''
  // titlecase and not first word of sentence
  if (index !== 0 && titleCase.test(str) === true && hasNumber.test(str) === false) {
    // skip Dates and stuff
    if (notProper.find((tag) => term.tags.has(tag))) {
      return
    }
    // first word in a quotation?
    if (term.pre.match(/["']$/)) {
      return
    }
    if (term.normal === 'the') {
      return
    }
    setTag([term], ['ProperNoun', 'Noun'], world, false, '2-titlecase')
  }
}
export default tagTitleCase
