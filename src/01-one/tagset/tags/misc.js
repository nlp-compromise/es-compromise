const anything = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord']

export default {
  Adjective: {
    aliases: [null, 'Adjetivo'],
    not: ['Noun', 'Verb', 'Adverb', 'Value'],
  },
  FemaleAdjective: {
    aliases: [null, 'AdjetivoFemenino'],
    is: 'Adjective',
    not: ['MaleAdjective'],
  },
  MaleAdjective: {
    aliases: [null, 'AdjetivoMasculino'],
    is: 'Adjective',
    not: ['FemaleAdjective'],
  },
  PluralAdjective: {
    aliases: [null, 'AdjetivoPlural'],
    is: 'Adjective',
    not: ['SingularAdjective'],
  },
  SingularAdjective: {
    aliases: [null, 'AdjetivoSingular'],
    is: 'Adjective',
    not: ['PluralAdjective'],
  },
  Comparable: {
    is: 'Adjective',
  },
  Comparative: {
    aliases: [null, 'Comparativo'],
    is: 'Adjective',
  },
  Superlative: {
    aliases: [null, 'Superlativo'],
    is: 'Adjective',
    not: ['Comparative'],
  },
  NumberRange: {
    aliases: [null, 'RangoNumérico'],
  },
  Adverb: {
    aliases: [null, 'Adverbio'],
    not: ['Noun', 'Verb', 'Adjective', 'Value'],
  },

  Determiner: {
    aliases: [null, 'Determinante', 'Artículo'],
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord', 'Conjunction'], //allow 'a' to be a Determiner/Value
  },
  Conjunction: {
    aliases: [null, 'Conjunción'],
    not: anything,
  },
  Preposition: {
    aliases: [null, 'Preposición'],
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
  },
  QuestionWord: {
    aliases: [null, 'Interrogativo'],
    not: ['Determiner'],
  },
  Currency: {
    aliases: [null, 'Moneda'],
    is: 'Noun',
  },
  Expression: {
    aliases: [null, 'Interjección'],
    not: ['Noun', 'Adjective', 'Verb', 'Adverb'],
  },
  Abbreviation: {
    aliases: [null, 'Abreviatura'],
  },
  Url: {
    not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
  },
  PhoneNumber: {
    aliases: [null, 'Teléfono'],
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
  },
  HashTag: {},
  AtMention: {
    aliases: [null, 'Mención'],
    is: 'Noun',
    not: ['HashTag', 'Email'],
  },
  Emoji: {
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
  },
  Emoticon: {
    aliases: [null, 'Emoticono'],
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
  },
  Email: {
    aliases: [null, 'Correo'],
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
  },
  Acronym: {
    aliases: [null, 'Acrónimo'],
    not: ['Plural', 'RomanNumeral'],
  },
  Condition: {
    aliases: [null, 'Condición'],
    not: ['Verb', 'Adjective', 'Noun', 'Value'],
  },
}
