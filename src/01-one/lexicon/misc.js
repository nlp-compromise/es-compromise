let copulas = [
  'está',
  'estaba',
  'estabais',
  'estábamos',
  'estaban',
  'estabas',
  'estado',
  'estáis',
  'estamos',
  'están',
  'estará',
  'estarán',
  'estarás',
  'estaré',
  'estaréis',
  'estaremos',
  'estaría',
  'estaríais',
  'estaríamos',
  'estarían',
  'estarías',
  'estás',
  'esté',
  'estéis',
  'estemos',
  'estén',
  'estés',
  'estoy',
  'estuve',
  'estuviera',
  'estuvierais',
  'estuviéramos',
  'estuvieran',
  'estuvieras',
  'estuviere',
  'estuviereis',
  'estuviéremos',
  'estuvieren',
  'estuvieres',
  'estuvieron',
  'estuviese',
  'estuvieseis',
  'estuviésemos',
  'estuviesen',
  'estuvieses',
  'estuvimos',
  'estuviste',
  'estuvisteis',
  'estuvo'
]

let haves = [
  'estado',
  'estando',
  'estar',
  'ha',
  'habéis',
  'haber',
  'había',
  'habíais',
  'habíamos',
  'habían',
  'habías',
  'habrá',
  'habrán',
  'habrás',
  'habré',
  'habréis',
  'habremos',
  'habría',
  'habríais',
  'habríamos',
  'habrían',
  'habrías',
  'han',
  'has',
  'haya',
  'hayáis',
  'hayan',
  'hayas',
  'he',
  'hemos',
  'hube',
  'hubiera',
  'hubierais',
  'hubiéramos',
  'hubieran',
  'hubieras',
  'hubiere',
  'hubiereis',
  'hubiéremos',
  'hubieren',
  'hubieres',
  'hubieron',
  'hubiese',
  'hubieseis',
  'hubiesen',
  'hubieses',
  'hubimos',
  'hubiste',
  'hubisteis',
  'hubo'
]

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
copulas.forEach((str) => {
  lex[str] = 'Copula'
})
haves.forEach((str) => {
  lex[str] = 'Auxiliary'
})

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
