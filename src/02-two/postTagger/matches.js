let net = null

let matches = [
  // east berlin
  { match: '[este] #Place', group: 0, tag: 'Adjective', reason: 'este-place' },
  // hundred and two
  { match: '#Value [y] #Value', group: 0, tag: 'TextValue', reason: 'num-y-num' },
  // minus 8
  { match: '[menos] #Value', group: 0, tag: 'TextValue', reason: 'minus 4' },
  // 3 pintas de cerveza
  { match: '#Value [#PresentTense] de #Noun', group: 0, tag: 'Plural', reason: '3-pintas' },

  // adjective-noun
  { match: '#Determiner [#Adjective]$', group: 0, tag: 'Noun', reason: 'det-adj' },

  // auxiliary verbs
  { match: '[#Modal] #Verb', group: 0, tag: 'Auxiliary', reason: 'modal-verb' },
  // alcanzar + infinitive (to manage to do)
  // comenzar + infinitive (to begin doing)
  // resultar + infinitive (to end up doing)
  { match: '[(alcanzar|comenzar|resultar)] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'alcanzar-inf' },
  // haber de + infinitive (to have to do)
  // parar de + infinitive (to stop doing)
  { match: '[(haber|parar) de] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'haber-de-inf' },
  // seguir + gerund (to keep on doing, to continue to do)
  { match: '[seguir] #Gerund', group: 0, tag: 'Auxiliary', reason: 'seguir-gerund' },
  // andar + present participle (to go about done)
  { match: '[andar] #Verb', group: 0, tag: 'Auxiliary', reason: 'andar-verb' },
  // acabar (present tense) de + past participle (to have recently done)
  { match: '[acabar] #Verb de', group: 0, tag: 'Auxiliary', reason: 'acabar-verb-de' },
  // echar a + infinitive (to begin doing)
  { match: '[echar] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'echar-inf' },
  // quedar en + infinitive (to arrange to do )
  { match: '[quedar en] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'quedar-en-inf' },

]


const postTagger = function (view) {
  const { world } = view
  const { methods } = world
  // rebuild this only lazily
  net = net || methods.one.buildNet(matches, world)
  // perform these matches on a comma-seperated document
  let document = methods.two.quickSplit(view.document)
  let ptrs = document.map(terms => {
    let t = terms[0]
    return [t.index[0], t.index[1], t.index[1] + terms.length]
  })
  let m = view.update(ptrs)
  m.cache()
  m.sweep(net)
  view.uncache()
  // view.cache()
  return view
}
export default postTagger