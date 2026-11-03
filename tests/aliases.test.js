import test from 'tape'
import nlp from './_lib.js'
const here = '[es-aliases] '

// every alias, and the tag it stands for
const aliases = {
  // nouns
  Sustantivo: 'Noun',
  NombrePropio: 'ProperNoun',
  Persona: 'Person',
  Nombre: 'FirstName',
  NombreMasculino: 'MaleName',
  NombreFemenino: 'FemaleName',
  Apellido: 'LastName',
  Título: 'Honorific',
  Lugar: 'Place',
  País: 'Country',
  Ciudad: 'City',
  Región: 'Region',
  Dirección: 'Address',
  Organización: 'Organization',
  Equipo: 'SportsTeam',
  Escuela: 'School',
  Empresa: 'Company',
  Incontable: 'Uncountable',
  Pronombre: 'Pronoun',
  Actividad: 'Activity',
  Unidad: 'Unit',
  Gentilicio: 'Demonym',
  Posesivo: 'Possessive',
  SustantivoMasculino: 'MaleNoun',
  SustantivoFemenino: 'FemaleNoun',
  // verbs
  Verbo: 'Verb',
  Presente: 'PresentTense',
  Infinitivo: 'Infinitive',
  Gerundio: 'Gerund',
  Pasado: 'PastTense',
  Imperfecto: 'Imperfect',
  Futuro: 'FutureTense',
  Cópula: 'Copula',
  Negación: 'Negative',
  PretéritoPerfecto: 'PerfectTense',
  Pluscuamperfecto: 'Pluperfect',
  Participio: 'Participle',
  Auxiliar: 'Auxiliary',
  Condicional: 'Conditional',
  Reflexivo: 'Reflexive',
  Imperativo: 'Imperative',
  Subjuntivo: 'Subjunctive',
  PrimeraPersona: 'FirstPerson',
  SegundaPersona: 'SecondPerson',
  TerceraPersona: 'ThirdPerson',
  PrimeraPersonaPlural: 'FirstPersonPlural',
  SegundaPersonaPlural: 'SecondPersonPlural',
  TerceraPersonaPlural: 'ThirdPersonPlural',
  // values
  Número: 'Value',
  Fracción: 'Fraction',
  Múltiplo: 'Multiple',
  NúmeroRomano: 'RomanNumeral',
  Numeral: 'TextValue',
  Numérico: 'NumericValue',
  Dinero: 'Money',
  Porcentaje: 'Percent',
  // dates
  Fecha: 'Date',
  Mes: 'Month',
  DíaDeLaSemana: 'WeekDay',
  Año: 'Year',
  Trimestre: 'FinancialQuarter',
  Festivo: 'Holiday',
  Estación: 'Season',
  ZonaHoraria: 'Timezone',
  Hora: 'Time',
  Duración: 'Duration',
  // misc
  Adjetivo: 'Adjective',
  AdjetivoFemenino: 'FemaleAdjective',
  AdjetivoMasculino: 'MaleAdjective',
  AdjetivoPlural: 'PluralAdjective',
  AdjetivoSingular: 'SingularAdjective',
  Comparativo: 'Comparative',
  Superlativo: 'Superlative',
  RangoNumérico: 'NumberRange',
  Adverbio: 'Adverb',
  Determinante: 'Determiner',
  Artículo: 'Determiner',
  Conjunción: 'Conjunction',
  Preposición: 'Preposition',
  Interrogativo: 'QuestionWord',
  Moneda: 'Currency',
  Interjección: 'Expression',
  Abreviatura: 'Abbreviation',
  Teléfono: 'PhoneNumber',
  Mención: 'AtMention',
  Emoticono: 'Emoticon',
  Correo: 'Email',
  Acrónimo: 'Acronym',
  Condición: 'Condition',
}

test('aliases point to the right tag:', function (t) {
  const { tagAliases } = nlp.world().model.one
  Object.keys(aliases).forEach(alias => {
    t.equal(tagAliases[alias], aliases[alias], here + `#${alias} is #${aliases[alias]}`)
  })
  t.end()
})

test('aliases match a tagged term:', function (t) {
  Object.keys(aliases).forEach(alias => {
    const doc = nlp('el perro').tag(aliases[alias])
    t.ok(doc.has(`#${alias}`), here + `#${alias} finds a #${aliases[alias]}`)
  })
  t.end()
})

test('every alias in the tagset is tested, and titlecase:', function (t) {
  const { tagSet } = nlp.world().model.one
  Object.keys(tagSet).forEach(tag => {
    const names = (tagSet[tag].aliases || []).filter(name => name !== null)
    names.forEach(name => {
      t.equal(aliases[name], tag, here + `#${name} is listed for #${tag}`)
      t.ok(/^\p{Lu}/u.test(name), here + `#${name} is titlecase`)
    })
  })
  t.end()
})

test('aliases match real sentences:', function (t) {
  const arr = [
    ['el perro pequeño', '#Artículo #Sustantivo #Adjetivo'],
    ['en la casa', '#Preposición #Determinante #Sustantivo'],
    ['mi casa', '#Posesivo #Sustantivo'],
    ['spencer', '#Persona'],
    ['tony', '#NombreMasculino'],
    ['chicago', '#Ciudad'],
    ['chicago', '#Lugar'],
    ['lloramos', '#Verbo'],
    ['lloramos', '#PrimeraPersonaPlural'],
    ['quedé', '#Pasado'],
    ['era', '#Imperfecto'],
    ['era', '#Cópula'],
    ['quedaré', '#Futuro'],
    ['quedaría', '#Condicional'],
    ['quedes', '#Subjuntivo'],
    ['hablando', '#Gerundio'],
    ['hablar', '#Infinitivo'],
    ['ha', '#Auxiliar'],
    ['no', '#Negación'],
    ['abnegada', '#AdjetivoFemenino'],
    ['abnegadas', '#AdjetivoPlural'],
    ['abnegada', '#AdjetivoSingular'],
    ['234', '#Número'],
    ['234', '#Numérico'],
    ['junio', '#Mes'],
    ['junio', '#Fecha'],
    ['lunes', '#DíaDeLaSemana'],
  ]
  arr.forEach(function (a) {
    const [str, match] = a
    const doc = nlp(str)
    const tags = doc.json()[0].terms.map(term => term.tags[0])
    const msg = `'${(str + "' ").padEnd(20, ' ')}  - '${match}' - '${tags.join(', ')}'`
    t.equal(doc.match(match).text(), doc.text(), here + msg)
  })
  t.end()
})

test('aliases work in match syntax:', function (t) {
  const doc = nlp('el perro')
  const [det, noun] = doc.json()[0].terms.map(term => term.text)
  // lowercase is title-cased, as with any tag
  t.ok(doc.has('#sustantivo'), here + 'lowercase')
  t.ok(nlp('en la casa').has('#preposición'), here + 'lowercase preposition')
  t.equal(doc.match('!#Sustantivo').text(), det, here + 'negative')
  t.equal(doc.match('(#Auxiliar|#Determinante) #Sustantivo').text(), doc.text(), here + 'or-block')
  t.equal(doc.match('#Determinante [#Sustantivo]', 0).text(), noun, here + 'capture')
  t.equal(doc.match('#Determinante #Adjetivo? #Sustantivo').text(), doc.text(), here + 'optional')
  t.equal(doc.not('#Determinante').text(), noun, here + 'not()')
  t.equal(doc.if('#Sustantivo').length, 1, here + 'if()')
  t.end()
})

test('aliases do not over-match:', function (t) {
  const doc = nlp('el perro')
  t.notOk(doc.has('#Auxiliar'), here + 'no #Auxiliar')
  t.notOk(doc.has('#Preposición'), here + 'no #Preposición')
  t.notOk(doc.has('#Tontería'), here + 'an unknown tag finds nothing')
  t.end()
})

test('aliases can also set tags:', function (t) {
  const doc = nlp('el perro').tag('Auxiliar')
  t.ok(doc.has('#Auxiliary'), here + 'tag() with an alias')
  doc.unTag('Auxiliar')
  t.notOk(doc.has('#Auxiliary'), here + 'unTag() with an alias')
  t.end()
})

test('english tag names are unchanged:', function (t) {
  const doc = nlp('el perro')
  t.ok(doc.has('#Determiner #Noun'), here + 'canonical names still match')
  t.ok(doc.out('spec').includes('{Determiner,Noun}'), here + 'spec output is canonical')
  const tags = doc.json()[0].terms[1].tags
  t.ok(tags.includes('Noun'), here + 'json has #Noun')
  t.notOk(tags.includes('Sustantivo'), here + 'json has no #Sustantivo')
  t.end()
})
