export default {
  Verb: {
    not: ['Noun', 'Adjective', 'Adverb', 'Value', 'Expression'],
  },
  PresentTense: {
    is: 'Verb',
    not: ['PastTense'],
  },
  // non-finite - 'hablar' is not a present-tense form in spanish
  Infinitive: {
    is: 'Verb',
    not: ['PresentTense', 'PastTense', 'FutureTense', 'Gerund'],
  },
  // non-finite - 'hablando'
  Gerund: {
    is: 'Verb',
    not: ['PresentTense', 'PastTense', 'FutureTense', 'Copula'],
  },
  PastTense: {
    is: 'Verb',
    not: ['PresentTense', 'Gerund', 'FutureTense'],
  },
  // pretérito imperfecto - 'hablaba'
  Imperfect: {
    is: 'PastTense',
    not: ['Conditional'],
  },
  FutureTense: {
    is: 'Verb',
    not: ['PresentTense', 'Gerund', 'PastTense'],
  },
  Copula: {
    is: 'Verb',
  },
  // a feature-tag - 'no', 'nunca' are not verbs
  Negative: {},
  Modal: {
    is: 'Verb',
    not: ['Infinitive'],
  },
  PerfectTense: {
    is: 'Verb',
    not: ['Gerund'],
  },
  Pluperfect: {
    is: 'Verb',
  },
  Participle: {
    is: 'PastTense',
  },
  PhrasalVerb: {
    is: 'Verb',
  },
  Particle: {
    is: 'PhrasalVerb',
    not: ['PastTense', 'PresentTense', 'Copula', 'Gerund'],
  },
  Auxiliary: {
    is: 'Verb',
    not: ['PastTense', 'PresentTense', 'Gerund', 'Conjunction'],
  },
  Conditional: {
    is: 'Verb',
    not: ['Infinitive', 'Imperative'],
  },
  Reflexive: {
    is: 'Verb',
  },
  // sometimes 'pretérito'
  Perfecto: {
    is: 'Verb',
  },
  // moods
  Imperative: {
    is: 'Verb',
    not: ['Subjunctive']
  },
  Subjunctive: {
    is: 'Verb',
    not: ['Imperative']
  },


  // 
  FirstPerson: {
    is: 'Verb',
    not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  SecondPerson: {
    is: 'Verb',
    not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  ThirdPerson: {
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  FirstPersonPlural: {
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  SecondPersonPlural: {
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural']
  },
  ThirdPersonPlural: {
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural']
  },
}
