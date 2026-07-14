// '¡Corre más rápido!' - a sentence-initial verb in an exclamation is a command.
// tú/usted commands share their form with the present-tense, so they need this context to disambiguate
const checkImperative = function (terms, i, world) {
  const setTag = world.methods.one.setTag
  let term = terms[i]
  if (i !== 0 || !term.pre.includes('¡')) {
    return
  }
  if (
    term.tags.has('PresentTense') &&
    (term.tags.has('SecondPerson') || term.tags.has('ThirdPerson'))
  ) {
    setTag([term], 'Imperative', world, false, '3-exclamation-imperative')
  }
}
export default checkImperative
