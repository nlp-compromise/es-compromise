
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
  const { verb, noun, adjective } = view.world.methods.two.transform
  view.docs.forEach(terms => {
    terms.forEach(term => {
      let str = term.implicit || term.normal || term.text

      // get infinitive form of the verb
      if (term.tags.has('Verb')) {
        let form = verbForm(term)
        if (term.tags.has('PresentTense')) {
          term.root = verb.toRoot.fromPresent(str, form)
        }
        if (term.tags.has('PastTense')) {
          term.root = verb.toRoot.fromPast(str, form)
        }
        if (term.tags.has('FutureTense')) {
          term.root = verb.toRoot.fromFuture(str, form)
        }
        if (term.tags.has('Conditional')) {
          term.root = verb.toRoot.fromConditional(str, form)
        }
      }

      // nouns -> singular masculine form
      if (term.tags.has('Noun') && term.tags.has('Plural')) {
        term.root = noun.toSingular(str)
      }

      // nouns -> singular masculine form
      if (term.tags.has('Adjective')) {
        if (term.tags.has('PluralAdjective')) {
          str = adjective.adjToSingular(str)
        }
        if (term.tags.has('FemaleAdjective')) {
          str = adjective.adjToMasculine(str)
        }
        term.root = str
      }
    })
  })
  return view
}
export default root