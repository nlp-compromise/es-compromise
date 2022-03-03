const rb = 'Adverb'
const nn = 'Noun'
const vb = 'Verb'
const jj = 'Adjective'

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
    // ida: vb,
  },
  {
    // four-letter suffixes
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
    ando: vb,
    ados: vb,
    aron: vb,
    adas: vb,
    tado: vb,
  },
  { // five-letter suffixes
    'ación': nn,
    mente: rb,
    iendo: vb,
    ieron: vb,
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