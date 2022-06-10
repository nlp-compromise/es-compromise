const rb = 'Adverb'
const nn = 'Noun'
const vb = 'Verb'
const jj = 'Adjective'
const cond = 'Conditional'
const fut = 'FutureTense'
const inf = 'Infinitive'
const g = 'Gerund'
const ref = 'Reflexive'
const first = 'FirstPerson'

export default [
  null,
  {
    // one-letter suffixes
    'ó': vb,
  },
  {
    // two-letter suffixes
    al: jj,
    // no: jj,
    // do: vb,
    // ar: vb,
    an: vb,
    'ió': vb,
    en: vb,
    ir: vb,
    er: vb,
    'tó': vb,
  },
  {
    // three-letter suffixes
    ico: jj,
    // ica: jj,
    ble: jj,
    nal: jj,
    ial: jj,
    oso: jj,
    ana: jj,
    // ado: vb,
    ndo: first,
    ada: vb,
    ron: vb,
    // ido: vb,
    aba: vb,
    tar: vb,
    'ían': vb,
    rar: vb,
    ría: cond,
    aré: fut,
    iré: fut,
    eré: fut,
    rás: fut,
    ará: fut,
    ado: vb,
    // ida: vb,
  },
  {
    // four-letter suffixes
    arse: inf,
    irse: inf,
    ales: jj,
    icos: jj,
    icas: jj,
    tico: jj,
    tica: jj,
    able: jj,
    tivo: jj,
    aria: jj,
    bles: jj,
    tiva: jj,
    ante: jj,
    'ción': nn,
    idad: nn,
    ento: nn,
    ncia: nn,
    'sión': nn,
    ando: g,
    endo: g,
    // ados: vb,
    aron: vb,
    adas: vb,
    tado: first,
    rías: cond,
    amos: cond,
    íais: cond,
    rían: cond,
    réis: fut,
    arán: fut,
    // refexive verbs
    arse: inf,
    arte: inf,
    arme: inf,
    irse: inf,
    irte: inf,
    erse: inf,
    dose: ref,
  },
  { // five-letter suffixes
    'ación': nn,
    mente: rb,
    iendo: g,
    yendo: g,
    ieron: vb,
    remos: fut,
    iente: jj,
  },
  {
    // six-letter suffixes
    ciones: nn
  },
  {
    // seven-letter suffixes
    aciones: nn
  }
]