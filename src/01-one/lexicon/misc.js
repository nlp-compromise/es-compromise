let lex = {
  se: 'Verb',
  era: 'PastTense',

  que: 'QuestionWord',
  como: 'QuestionWord',
  donde: 'QuestionWord',
  cuando: 'QuestionWord',

  lo: 'Pronoun',
  uno: 'Determiner',
  si: 'Condition',
  hay: 'Adverb',
  había: 'Verb',
  sido: 'Verb',

  no: 'Negative',
  nunca: 'Negative', //never

  irse: ['Reflexive', 'Infinitive']
}

//possessive pronouns
const pps = [
  'mi', // singular  my (masculine and feminine)
  'mis', // plural my (masculine and feminine)
  'tu', // singular  your (informal singular, masculine and feminine)
  'tus', // plural your (informal singular, masculine and feminine)
  'su', // singular" his/her/its/your (formal singular, masculine and feminine)
  'sus', // plural  his/her/its/your/their (masculine and feminine)
  'nuestro', // singular masculine our
  'nuestra', // singular feminine  our
  'nuestros', // plural masculine  our
  'nuestras', // plural feminine   our
  'vuestro', // singular masculine your (informal plural)
  'vuestra', // singular feminine  your (informal plural)
  'vuestros', // plural masculine  your (informal plural)
  'vuestras' // plural feminine     your (informal plural)
]
pps.forEach((str) => {
  lex[str] = ['Pronoun', 'Possessive']
})
export default lex
