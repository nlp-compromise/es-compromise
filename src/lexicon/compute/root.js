
const verbForm = function (term) {
  let want = [
    'FirstPerson',
    'SecondPerson',
    'ThirdPerson',
    'FirstPersonPlural',
    'SecondPersonPlural',
    'ThirdPersonPlural',
  ]
  return want.find(tag => term.tags.has(tag))
}

const root = function (view) {
  const toRoot = view.world.methods.two.transform.toRoot
  view.docs.forEach(terms => {
    terms.forEach(term => {
      let str = term.implicit || term.normal || term.text

      // get infinitive form of the verb
      if (term.tags.has('Verb')) {
        let form = verbForm(term)
        if (term.tags.has('PresentTense')) {
          term.root = toRoot.verb.fromPresent(str, form)
        }
        if (term.tags.has('PastTense')) {
          term.root = toRoot.verb.fromPast(str, form)
        }
        if (term.tags.has('FutureTense')) {
          term.root = toRoot.verb.fromFuture(str, form)
        }
        if (term.tags.has('Conditional')) {
          term.root = toRoot.verb.fromConditional(str, form)
        }
      }
      // nouns -> singular masculine form
      // if (term.tags.has('Noun') && !term.tags.has('Pronoun')) {
      //   let isPlural = term.tags.has('PluralNoun')
      //   let gender = term.tags.has('FemaleNoun') ? 'f' : 'm'
      //   // term.root = toRoot.noun(str, isPlural, gender)
      // }
    })
  })
  return view
}
export default root