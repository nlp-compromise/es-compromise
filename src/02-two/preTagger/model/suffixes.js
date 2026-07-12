const rb = 'Adverb'
const nn = 'Noun'
const vb = 'Verb'
const jj = 'Adjective'
const cond = 'Conditional'
const fut = 'FutureTense'
// const inf = 'Infinitive'
const g = 'Gerund'
const ref = 'Reflexive'
const imp = 'Imperfect'
const pl = ['Noun', 'Plural']

export default [
  null,
  {
    // one-letter suffixes
    'ó': vb,
  },
  {
    // two-letter suffixes
    al: jj,
    ño: jj,
    // no: jj,
    // do: vb,
    // ar: vb,
    // an: vb, - too greedy - 'pan', 'plan', 'capitán'
    'ió': vb,
    // en: vb, - too greedy - 'examen', 'imagen', 'orden'
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
    iso: jj,
    ito: jj,
    ita: jj,
    izo: jj,
    cto: jj,
    ana: jj,
    eos: jj,
    // ado: vb,
    // ndo: first, - 'ando'/'endo' gerund rules cover this
    // ada: vb, - 'llegada', 'mirada' are nouns
    ron: vb,
    // ido: vb,
    aba: imp,
    tar: vb,
    gar: vb,
    nar: vb,
    'ían': imp,
    rar: vb,
    // ría: cond, - 'librería', 'categoría' - see aría/ería/iría below
    aré: fut,
    iré: fut,
    eré: fut,
    rás: fut,
    ará: fut,
    ado: vb,
    pto: jj,
    osa: jj,
    tos: pl,

    // ida: vb,
  },
  {
    // four-letter suffixes
    itas: jj,
    itos: jj,
    icos: jj,
    icas: jj,
    tico: jj,
    fica: jj,
    gica: jj,
    mica: jj,
    nica: jj,
    lica: jj,
    tica: jj,
    able: jj,
    tivo: jj,
    sivo: jj,
    esco: jj,
    iaco: jj,
    íaco: jj,
    áceo: jj,
    áneo: jj,
    icio: jj,
    culo: jj,
    aria: jj,
    bles: jj,
    tiva: jj,
    ante: jj,
    ente: jj,
    ánea: jj,
    siva: jj,
    ular: jj,
    osas: jj,
    ales: jj,
    iles: jj,
    anos: jj,
    osos: jj,
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
    // tado: first, - 'cantado' is a participle, not first-person
    // amos: cond, - '-amos' is present/preterite, never conditional
    // rías: cond, - 'librerías' - see arías/erías/irías below
    // rían: cond,
    abas: imp,
    aban: imp,
    'íais': imp,
    'aría': cond,
    // ería: cond, - 'librería', 'panadería' - too many -ería nouns
    'iría': cond,
    'dría': cond, // podría, tendría
    'bría': cond, // habría, sabría
    réis: fut,
    arán: fut,
    // refexive verbs
    arse: ref,
    arte: ref,
    arme: ref,
    irse: ref,
    irte: ref,
    erse: ref,
    dose: ref,
    ario: jj,
    orio: jj,
    iano: jj,
    dero: jj,
    fero: jj,
    jero: jj,
    lero: jj,
    nero: jj,
    tero: jj,
    ares: pl, // lugares, hogares
    ores: pl, // profesores, flores
    rios: jj,
    ivos: jj,
  },
  { // five-letter suffixes
    'ación': nn,
    mente: rb,
    ísimo: jj,
    icano: jj,
    ntino: jj,
    tivas: jj,
    andés: jj,
    adora: jj,
    antes: jj,
    iendo: g,
    yendo: g,
    ieron: vb,
    remos: fut,
    iente: jj,
    entes: jj,
    'íamos': imp,
    'arías': cond,
    // erías: cond, - 'librerías'
    'irías': cond,
    'drías': cond,
    'brías': cond,
    'arían': cond,
    'erían': cond,
    'irían': cond,
    'drían': cond,
    'brían': cond,
  },
  {
    // six-letter suffixes
    ística: jj,
    ciones: nn,
    'ábamos': imp,
    'ríamos': cond,
  },
  {
    // seven-letter suffixes
    aciones: nn
  }
]