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
  { match: '#Determiner [#Adjective] (de|del)', group: 0, tag: 'Noun', reason: 'det-adj' },

  // homographs - 'él vino a casa' (he came home)
  { match: '#Pronoun [vino] (a|de|en|con)', group: 0, tag: ['Verb', 'PastTense', 'ThirdPerson'], reason: 'el-vino' },
  // 'la cura', 'el canto' - determiner + verb-form is a noun
  { match: '(el|la|un|una) [#PresentTense]$', group: 0, tag: 'Noun', reason: 'la-cura' },
  { match: '(el|la|un|una) [#PresentTense] #Preposition', group: 0, tag: 'Noun', reason: 'el-canto-de' },
  // 'las casas' - plural determiner + verb-form is a plural noun
  { match: '(los|las|unos|unas) [#PresentTense]$', group: 0, tag: 'Plural', reason: 'las-casas' },
  // 'gran parte de', 'forma parte de'
  { match: '(gran|mayor|buena|toda|esa|esta) [parte]', group: 0, tag: 'Noun', reason: 'gran-parte' },

  // no exageres
  { match: 'no [#Noun]', group: 0, tag: 'Verb', reason: 'no-noun' },

  // moods
  // 'espero que tengas' - a command-form after 'que' is subjunctive
  { match: 'que [#Imperative]', group: 0, tag: 'Subjunctive', reason: 'que-subjunctive' },
  // 'ojalá llueva mañana'
  { match: '(ojalá|quizás|quizá) [#Imperative]', group: 0, tag: 'Subjunctive', reason: 'ojalá-subjunctive' },
  // 'no hables tan alto' - a negative command borrows the subjunctive form
  { match: '^no [#Subjunctive]', group: 0, tag: 'Imperative', reason: 'negative-imperative' },

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
  // poder  "to be able to"
  { match: '[{poder/verb}] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'poder-inf' },
  // any missing estar
  { match: '[#Copula] #Infinitive', group: 0, tag: 'Auxiliary', reason: 'copula-inf' },

  // possessives - 'my taste'
  { match: '(#Possessive && #Determiner) [#FirstPerson]', group: 0, tag: 'Noun', reason: 'mi-gusto' },
  //Los avances en
  { match: '(los|las) [#Verb] #Preposition', group: 0, tag: 'Plural', reason: 'los-advances' },
  //confundo los numbres
  { match: '#Verb (los|las) [#Verb]$', group: 0, tag: 'Plural', reason: 'los-numbres' },
  //de la cola
  { match: 'de (la|las) [#Verb]', group: 0, tag: 'Noun', reason: 'de-la-cola' },
  //of the #verb
  { match: 'del [#Verb]', group: 0, tag: 'Noun', reason: 'del-verb' }
]
