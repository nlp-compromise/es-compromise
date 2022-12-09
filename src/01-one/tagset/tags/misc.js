const anything = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord']

export default {
  Adjective: {
    not: ['Noun', 'Verb', 'Adverb', 'Value'],
  },
  FemaleAdjective: {
    is: 'Adjective',
    not: ['MaleAdjective'],
  },
  MaleAdjective: {
    is: 'Adjective',
    not: ['FemaleAdjective'],
  },
  PluralAdjective: {
    is: 'Adjective',
    not: ['SingularAdjective'],
  },
  SingularAdjective: {
    is: 'Adjective',
    not: ['PluralAdjective'],
  },
  Comparable: {
    is: 'Adjective',
  },
  Comparative: {
    is: 'Adjective',
  },
  Superlative: {
    is: 'Adjective',
    not: ['Comparative'],
  },
  NumberRange: {},
  Adverb: {
    not: ['Noun', 'Verb', 'Adjective', 'Value'],
  },

  Determiner: {
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord', 'Conjunction'], //allow 'a' to be a Determiner/Value
  },
  Conjunction: {
    not: anything,
  },
  Preposition: {
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
  },
  QuestionWord: {
    not: ['Determiner'],
  },
  Currency: {
    is: 'Noun',
  },
  Expression: {
    not: ['Noun', 'Adjective', 'Verb', 'Adverb'],
  },
  Abbreviation: {},
  Url: {
    not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
  },
  PhoneNumber: {
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
  },
  HashTag: {},
  AtMention: {
    is: 'Noun',
    not: ['HashTag', 'Email'],
  },
  Emoji: {
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
  },
  Emoticon: {
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
  },
  Email: {
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
  },
  Acronym: {
    not: ['Plural', 'RomanNumeral'],
  },
  Condition: {
    not: ['Verb', 'Adjective', 'Noun', 'Value'],
  },
}
