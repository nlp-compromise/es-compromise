export default {
  Verb: {
    not: ['Noun', 'Adjective', 'Adverb', 'Value', 'Expression'],
  },
  PresentTense: {
    is: 'Verb',
    not: ['PastTense'],
  },
  Infinitive: {
    is: 'PresentTense',
    not: ['Gerund'],
  },
  Imperative: {
    is: 'Infinitive',
  },
  Gerund: {
    is: 'PresentTense',
    not: ['Copula', 'FutureTense'],
  },
  PastTense: {
    is: 'Verb',
    not: ['PresentTense', 'Gerund', 'FutureTense'],
  },
  FutureTense: {
    is: 'Verb',
    not: ['PresentTense', 'Gerund', 'PastTense'],
  },
  Copula: {
    is: 'Verb',
  },
  Negative: {
    is: 'Verb',
  },
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
