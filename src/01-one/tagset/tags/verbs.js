export default {
  Verb: {
    aliases: [null, 'Verbo'],
    not: ['Noun', 'Adjective', 'Adverb', 'Value', 'Expression'],
  },
  PresentTense: {
    aliases: [null, 'Presente'],
    is: 'Verb',
    not: ['PastTense'],
  },
  // non-finite - 'hablar' is not a present-tense form in spanish
  Infinitive: {
    aliases: [null, 'Infinitivo'],
    is: 'Verb',
    not: ['PresentTense', 'PastTense', 'FutureTense', 'Gerund'],
  },
  // non-finite - 'hablando'
  Gerund: {
    aliases: [null, 'Gerundio'],
    is: 'Verb',
    not: ['PresentTense', 'PastTense', 'FutureTense', 'Copula'],
  },
  PastTense: {
    aliases: [null, 'Pasado'],
    is: 'Verb',
    not: ['PresentTense', 'Gerund', 'FutureTense'],
  },
  // pretérito imperfecto - 'hablaba'
  Imperfect: {
    aliases: [null, 'Imperfecto'],
    is: 'PastTense',
    not: ['Conditional'],
  },
  FutureTense: {
    aliases: [null, 'Futuro'],
    is: 'Verb',
    not: ['PresentTense', 'Gerund', 'PastTense'],
  },
  Copula: {
    aliases: [null, 'Cópula'],
    is: 'Verb',
  },
  // a feature-tag - 'no', 'nunca' are not verbs
  Negative: {
    aliases: [null, 'Negación'],
  },
  Modal: {
    is: 'Verb',
    not: ['Infinitive'],
  },
  PerfectTense: {
    aliases: [null, 'PretéritoPerfecto'],
    is: 'Verb',
    not: ['Gerund'],
  },
  Pluperfect: {
    aliases: [null, 'Pluscuamperfecto'],
    is: 'Verb',
  },
  Participle: {
    aliases: [null, 'Participio'],
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
    aliases: [null, 'Auxiliar'],
    is: 'Verb',
    not: ['PastTense', 'PresentTense', 'Gerund', 'Conjunction'],
  },
  Conditional: {
    aliases: [null, 'Condicional'],
    is: 'Verb',
    not: ['Infinitive', 'Imperative'],
  },
  Reflexive: {
    aliases: [null, 'Reflexivo'],
    is: 'Verb',
  },
  // sometimes 'pretérito'
  Perfecto: {
    is: 'Verb',
  },
  // moods
  Imperative: {
    aliases: [null, 'Imperativo'],
    is: 'Verb',
    not: ['Subjunctive']
  },
  Subjunctive: {
    aliases: [null, 'Subjuntivo'],
    is: 'Verb',
    not: ['Imperative']
  },


  // 
  FirstPerson: {
    aliases: [null, 'PrimeraPersona'],
    is: 'Verb',
    not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  SecondPerson: {
    aliases: [null, 'SegundaPersona'],
    is: 'Verb',
    not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  ThirdPerson: {
    aliases: [null, 'TerceraPersona'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  FirstPersonPlural: {
    aliases: [null, 'PrimeraPersonaPlural'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  SecondPersonPlural: {
    aliases: [null, 'SegundaPersonaPlural'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural']
  },
  ThirdPersonPlural: {
    aliases: [null, 'TerceraPersonaPlural'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural']
  },
}
