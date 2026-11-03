const entity = ['Person', 'Place', 'Organization']

export default {
  Noun: {
    aliases: [null, 'Sustantivo'],
    not: ['Verb', 'Adjective', 'Adverb', 'Value', 'Determiner'],
  },
  Singular: {
    is: 'Noun',
    not: ['Plural'],
  },
  ProperNoun: {
    aliases: [null, 'NombrePropio'],
    is: 'Noun',
  },
  Person: {
    aliases: [null, 'Persona'],
    is: 'Singular',
    also: ['ProperNoun'],
    not: ['Place', 'Organization', 'Date'],
  },
  FirstName: {
    aliases: [null, 'Nombre'],
    is: 'Person',
  },
  MaleName: {
    aliases: [null, 'NombreMasculino'],
    is: 'FirstName',
    not: ['FemaleName', 'LastName'],
  },
  FemaleName: {
    aliases: [null, 'NombreFemenino'],
    is: 'FirstName',
    not: ['MaleName', 'LastName'],
  },
  LastName: {
    aliases: [null, 'Apellido'],
    is: 'Person',
    not: ['FirstName'],
  },
  Honorific: {
    aliases: [null, 'Título'],
    is: 'Noun',
    not: ['FirstName', 'LastName', 'Value'],
  },
  Place: {
    aliases: [null, 'Lugar'],
    is: 'Singular',
    not: ['Person', 'Organization'],
  },
  Country: {
    aliases: [null, 'País'],
    is: 'Place',
    also: ['ProperNoun'],
    not: ['City'],
  },
  City: {
    aliases: [null, 'Ciudad'],
    is: 'Place',
    also: ['ProperNoun'],
    not: ['Country'],
  },
  Region: {
    aliases: [null, 'Región'],
    is: 'Place',
    also: ['ProperNoun'],
  },
  Address: {
    aliases: [null, 'Dirección'],
    // is: 'Place',
  },
  Organization: {
    aliases: [null, 'Organización'],
    is: 'ProperNoun',
    not: ['Person', 'Place'],
  },
  SportsTeam: {
    aliases: [null, 'Equipo'],
    is: 'Organization',
  },
  School: {
    aliases: [null, 'Escuela'],
    is: 'Organization',
  },
  Company: {
    aliases: [null, 'Empresa'],
    is: 'Organization',
  },
  Plural: {
    is: 'Noun',
    not: ['Singular'],
  },
  Uncountable: {
    aliases: [null, 'Incontable'],
    is: 'Noun',
  },
  Pronoun: {
    aliases: [null, 'Pronombre'],
    is: 'Noun',
    not: entity,
  },
  Actor: {
    is: 'Noun',
    not: entity,
  },
  Activity: {
    aliases: [null, 'Actividad'],
    is: 'Noun',
    not: ['Person', 'Place'],
  },
  Unit: {
    aliases: [null, 'Unidad'],
    is: 'Noun',
    not: entity,
  },
  Demonym: {
    aliases: [null, 'Gentilicio'],
    is: 'Noun',
    also: ['ProperNoun'],
    not: entity,
  },
  // a feature-tag - applies to determiners ('mi casa') and pronouns ('es mío')
  Possessive: {
    aliases: [null, 'Posesivo'],
  },

  FemaleNoun: {
    aliases: [null, 'SustantivoFemenino'],
    is: 'Noun',
    not: ['MaleNoun']
  },
  MaleNoun: {
    aliases: [null, 'SustantivoMasculino'],
    is: 'Noun',
    not: ['FemaleNoun']
  },

}
