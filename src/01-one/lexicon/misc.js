// hand-curated entries that win over everything else in the lexicon.
// spanish marks question-words with an accent - 'qué es' vs 'creo que es'
let lex = {
  // reflexive/impersonal clitic - 'se habla español'
  se: 'Pronoun',
  // 'yo sé' (saber) + imperative of ser
  'sé': ['Verb', 'PresentTense', 'FirstPerson'],

  // unaccented forms are conjunctions/relativizers
  que: 'Conjunction',
  como: 'Conjunction',
  donde: 'Pronoun',
  cuando: 'Conjunction',
  // accented forms are question-words
  'qué': 'QuestionWord',
  'cómo': 'QuestionWord',
  'dónde': 'QuestionWord',
  'cuándo': 'QuestionWord',
  'quién': 'QuestionWord',
  'quiénes': 'QuestionWord',
  'cuál': 'QuestionWord',
  'cuáles': 'QuestionWord',
  'cuánto': 'QuestionWord',
  'cuánta': 'QuestionWord',
  'cuántos': 'QuestionWord',
  'cuántas': 'QuestionWord',
  'por qué': 'QuestionWord',

  lo: 'Pronoun',
  algo: 'Pronoun',

  si: 'Condition',
  'sí': 'Adverb', // yes

  // impersonal 'there is/are' - present of haber
  hay: ['Verb', 'PresentTense'],

  no: 'Negative',
  nunca: 'Negative', //never

  // imperfect of ser
  era: ['Copula', 'Imperfect'],
  eras: ['Copula', 'Imperfect'],
  'éramos': ['Copula', 'Imperfect'],
  erais: ['Copula', 'Imperfect'],
  eran: ['Copula', 'Imperfect'],

  irse: ['Reflexive', 'Infinitive']
}

// possessive determiners - 'mi casa', not pronouns ('la mía')
const possDet = [
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
possDet.forEach((str) => {
  lex[str] = ['Determiner', 'Possessive']
})

// possessive pronouns - 'la casa es mía'
const possPro = [
  'mío', 'mía', 'míos', 'mías',
  'tuyo', 'tuya', 'tuyos', 'tuyas',
  'suyo', 'suya', 'suyos', 'suyas',
]
possPro.forEach((str) => {
  lex[str] = ['Pronoun', 'Possessive']
})
export default lex
