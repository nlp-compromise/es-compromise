// 1st pass
import checkRegex from './1st-pass/regex.js'
import titleCase from './1st-pass/titlecase.js'
import checkYear from './1st-pass/year.js'
// 2nd pass
import acronym from './2nd-pass/acronym.js'
import fallback from './2nd-pass/fallback.js'
// import titlecase from './2nd-pass/titlecase.js'
import suffixCheck from './2nd-pass/suffix-lookup.js'
// 3rd
import guessNounGender from './3rd-pass/noun-gender.js'
import guessPlural from './3rd-pass/noun-plural.js'
import adjPlural from './3rd-pass/adj-plural.js'
import adjGender from './3rd-pass/adj-gender.js'
import verbForm from './3rd-pass/verb-form.js'
import auxVerb from './3rd-pass/aux-verb.js'

// these methods don't care about word-neighbours
const firstPass = function (terms, world) {
  for (let i = 0; i < terms.length; i += 1) {
    //  is it titlecased?
    let found = titleCase(terms, i, world)
    // try look-like rules
    found = found || checkRegex(terms, i, world)
    // turn '1993' into a year
    checkYear(terms, i, world)
  }
}
const secondPass = function (terms, world) {
  for (let i = 0; i < terms.length; i += 1) {
    let found = acronym(terms, i, world)
    found = found || suffixCheck(terms, i, world)
    // found = found || neighbours(terms, i, world)
    found = found || fallback(terms, i, world)
  }
}

const thirdPass = function (terms, world) {
  for (let i = 0; i < terms.length; i += 1) {
    guessNounGender(terms, i, world)
    guessPlural(terms, i, world)
    adjPlural(terms, i, world)
    adjGender(terms, i, world)
    auxVerb(terms, i, world)
    verbForm(terms, i, world)
  }
}

const tagger = function (view) {
  let world = view.world
  view.docs.forEach((terms) => {
    firstPass(terms, world)
    secondPass(terms, world)
    thirdPass(terms, world)
  })
  return view
}
export default tagger
