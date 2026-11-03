export default {
  Value: {
    aliases: [null, 'Número'],
    not: ['Verb', 'Adjective', 'Adverb'],
  },
  Ordinal: {
    is: 'Value',
    not: ['Cardinal'],
  },
  Cardinal: {
    is: 'Value',
    not: ['Ordinal'],
  },
  Fraction: {
    aliases: [null, 'Fracción'],
    is: 'Value',
    not: ['Noun'],
  },
  Multiple: {
    aliases: [null, 'Múltiplo'],
    is: 'Value',
  },
  RomanNumeral: {
    aliases: [null, 'NúmeroRomano'],
    is: 'Cardinal',
    not: ['TextValue'],
  },
  TextValue: {
    aliases: [null, 'Numeral'],
    is: 'Value',
    not: ['NumericValue'],
  },
  NumericValue: {
    aliases: [null, 'Numérico'],
    is: 'Value',
    not: ['TextValue'],
  },
  Money: {
    aliases: [null, 'Dinero'],
    is: 'Cardinal',
  },
  Percent: {
    aliases: [null, 'Porcentaje'],
    is: 'Value',
  },
}
