// auxiliary forms we don't have conjugations of
let isAux = new Set([
  //  imperfect subjunctive of 'poder'
  'pudiera',
  'pudieras',
  'pudiera',
  'pudiéramos',
  'pudierais',
  'pudieran',
  'pudiese',
  'pudieses',
  'pudiese',
  'pudiésemos',
  'pudieseis',
  'pudiesen',
  // Ser (to be)
  // First set (-ara/-ase endings):
  'fuera',
  'fueras',
  'fuera',
  'fuéramos',
  'fuerais',
  'fueran',
  // Second set (-iera/-iese endings):
  'fuese',
  'fueses',
  'fuese',
  'fuésemos',
  'fueseis',
  'fuesen',

  // Haber (to have, when used as an auxiliary)
  // First set (-ara/-ase endings):
  'hubiera',
  'hubieras',
  'hubiera',
  'hubiéramos',
  'hubierais',
  'hubieran',

  // Second set (-iera/-iese endings):
  'hubiese',
  'hubieses',
  'hubiese',
  'hubiésemos',
  'hubieseis',
  'hubiesen',

  // Estar (to be, in the context of state / condition)
  // First set (-ara/-ase endings):
  'estuviera',
  'estuvieras',
  'estuviera',
  'estuviéramos',
  'estuvierais',
  'estuvieran',
  // Second set (-iera/-iese endings):
  'estuviese',
  'estuvieses',
  'estuviese',
  'estuviésemos',
  'estuvieseis',
  'estuviesen',

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

  // Tener (to have, in the context of possession', 'obligation)
  // First set (-ara/-ase endings):
  'tuviera',
  'tuvieras',
  'tuviera',
  'tuviéramos',
  'tuvierais',
  'tuvieran',
  // Second set (-iera/-iese endings):
  'tuviese',
  'tuvieses',
  'tuviese',
  'tuviésemos',
  'tuvieseis',
  'tuviesen',

  // Hacer (to do, to make)
  // First set (-ara/-ase endings):
  'hiciera',
  'hiciese',
  'hicieras',
  'hicieses',
  'hiciera',
  'hiciese',
  'hiciéramos',
  'hiciésemos',
  'hicierais',
  'hicieseis',
  'hicieran',
  'hiciesen',

  // Venir (to come)
  // First set (-ara/-ase endings):
  'viniera',
  'vinieras',
  'viniera',
  'viniéramos',
  'vinierais',
  'vinieran',
  // Second set (-iera/-iese endings):
  'viniese',
  'vinieses',
  'viniese',
  'viniésemos',
  'vinieseis',
  'viniesen'
])

const tagAuxVerb = function (terms, i, world) {
  const setTag = world.methods.one.setTag
  let term = terms[i]
  if (isAux.has(term.normal) && terms[i + 1] && terms[i].tags.has('Verb')) {
    setTag([term], 'Auxiliary', world, false, '3-auxiliary')
  }
}
export default tagAuxVerb
