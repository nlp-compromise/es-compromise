const rb = 'Adverb'
const nn = 'Noun'
const vb = 'Verb'
const jj = 'Adjective'
const cond = 'Conditional'
const fut = 'FutureTense'
const inf = 'Infinitive'
const g = 'Gerund'

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
    ndo: vb,
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
    tado: vb,
    rías: cond,
    amos: cond,
    íais: cond,
    rían: cond,
    réis: fut,
    arán: fut,
  },
  { // five-letter suffixes
    'ación': nn,
    mente: rb,
    iendo: vb,
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