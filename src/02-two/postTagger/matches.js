export default [
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
  // la tarde
  { match: '#Determiner [#Adverb]$', group: 0, tag: 'Noun', reason: 'det-adv' },
  // el final de
  { match: '#Determiner [#Adjective] (de|du)', group: 0, tag: 'Noun', reason: 'det-adj' },

  // no exageres
  { match: 'no [#Noun]', group: 0, tag: 'Verb', reason: 'no-noun' },

  // auxiliary verbs
  { match: '[#Modal] #Verb', group: 0, tag: 'Auxiliary', reason: 'modal-verb' },
  // alcanzar + infinitive (to manage to do)
  // comenzar + infinitive (to begin doing)
  // resultar + infinitive (to end up doing)
  {
    match: '[(alcanzar|comenzar|resultar)] #Infinitive',
    group: 0,
    tag: 'Auxiliary',
    reason: 'alcanzar-inf'
  },
  // haber de + infinitive (to have to do)
  // parar de + infinitive (to stop doing)
  { match: '[{haber/verb} de] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'haber-de-inf' },
  { match: '[{parar/verb} de] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'haber-de-inf' },
  // seguir + gerund (to keep on doing, to continue to do)
  { match: '[{seguir/verb}] #Gerund', group: 0, tag: 'Auxiliary', reason: 'seguir-gerund' },
  // be walking
  { match: '[{estar/verb}] #Gerund', group: 0, tag: 'Auxiliary', reason: 'estar-gerund' },
  // andar + present participle (to go about done)
  { match: '[{andar/verb}] #Verb', group: 0, tag: 'Auxiliary', reason: 'andar-verb' },
  // acabar (present tense) de + past participle (to have recently done)
  { match: '[{acabar/verb}] #Verb de', group: 0, tag: 'Auxiliary', reason: 'acabar-verb-de' },
  // echar a + infinitive (to begin doing)
  { match: '[{echar/verb}] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'echar-inf' },
  // quedar en + infinitive (to arrange to do )
  { match: '[{quedar/verb} en] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'quedar-en-inf' },

  // possessives - 'my taste'
  { match: '(#Possessive && #Pronoun) [#FirstPerson]', group: 0, tag: 'Noun', reason: 'mi-gusto' },
  //Los avances
  { match: '(los|las) [#Verb]', group: 0, tag: 'Plural', reason: 'los-advances' }
]
