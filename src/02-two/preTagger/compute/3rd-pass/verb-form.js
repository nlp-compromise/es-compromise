let rules = [
  // present-tense
  ['o', ['FirstPerson', 'PresentTense']],
  ['as', ['SecondPerson', 'PresentTense']],
  ['a', ['ThirdPerson', 'PresentTense']],
  ['mos', ['FirstPersonPlural', 'PresentTense']],
  ['áis', ['SecondPersonPlural', 'PresentTense']],
  ['éis', ['SecondPersonPlural', 'PresentTense']],
  ['an', ['ThirdPersonPlural', 'PresentTense']],
  // past-tense
  ['é', ['FirstPerson', 'PastTense']],
  ['ste', ['SecondPerson', 'PastTense']],
  ['ó', ['ThirdPerson', 'PastTense']],
  ['mos', ['FirstPersonPlural', 'PastTense']],
  ['eis', ['SecondPersonPlural', 'PastTense']],
  ['on', ['ThirdPersonPlural', 'PastTense']],
  // future-tense
  ['ré', ['FirstPerson', 'FutureTense']],
  ['rás', ['SecondPerson', 'FutureTense']],
  ['rá', ['ThirdPerson', 'FutureTense']],
  ['remos",', ['FirstPersonPlural', 'FutureTense']],
  ['réis', ['SecondPersonPlural', 'FutureTense']],
  ['rán', ['ThirdPersonPlural', 'FutureTense']],
  // conditional-tense
  ['ría', ['FirstPerson', 'Conditional']],
  ['rías', ['SecondPerson', 'Conditional']],
  // ['ría', ['ThirdPerson','Conditional']], //(same)
  ['ríamos', ['FirstPersonPlural', 'Conditional']],
  ['ríais', ['SecondPersonPlural', 'Conditional']],
  ['rían', ['ThirdPersonPlural', 'Conditional']],
]
// sort by suffix length
rules = rules.sort((a, b) => {
  if (a[0].length > b[0].length) {
    return -1
  } else if (a[0].length < b[0].length) {
    return 1
  }
  return 0
})

let forms = [
  'FirstPerson',
  'SecondPerson',
  'ThirdPerson',
  'FirstPersonPlural',
  'SecondPersonPlural',
  'ThirdPersonPlural',
  'PresentTense',
  'PastTense',
  'FutureTense',
  'Conditional'
]

//relajarse -> relajar
const stripReflexive = function (str) {
  str = str.replace(/se$/, '')
  str = str.replace(/te$/, '')
  str = str.replace(/me$/, '')
  return str
}

// deduce gender of an adjective, but it's suffix
const guessVerbForm = function (terms, i, world) {
  const setTag = world.methods.one.setTag
  let term = terms[i]
  if (term.tags.has('Verb')) {
    // skip these
    if (term.tags.has('Infinitive') || term.tags.has('Auxiliary') || term.tags.has('Negative')) {
      return
    }
    // do we already have both?
    if (forms.filter(tag => term.tags.has(tag)).length >= 2) {
      return
    }
    let str = term.machine || term.normal

    //relajarse -> relajar
    str = stripReflexive(str)
    for (let k = 0; k < rules.length; k += 1) {
      let [suff, tag] = rules[k]
      if (str.endsWith(suff)) {
        setTag([term], tag, world, true, '3-guessForm')
        break
      }
    }
  }
}
export default guessVerbForm
