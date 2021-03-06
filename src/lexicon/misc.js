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
  'estuvo',
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
  'hubo',
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
  'había': 'Verb',
  'sido': 'Verb',

  irse: ['Reflexive', 'Infinitive']
}
copulas.forEach(str => {
  lex[str] = 'Copula'
})
haves.forEach(str => {
  lex[str] = 'Auxiliary'
})

export default lex

