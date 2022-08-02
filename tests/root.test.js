import test from 'tape'
import nlp from './_lib.js'
let here = '[root-match] '
nlp.verbose(false)

test('root-match:', function (t) {
  let arr = [
    ['tiramos nuestros zapatos', '{tirar} nuestros {zapato}'],
    // verb toRoots
    ['seguir', '{seguir}'],//same
    ['seguí', '{seguir}'],//
    ['seguiste', '{seguir}'],//
    ['siguió', '{seguir}'],//
    ['seguimos', '{seguir}'],//
    ['seguisteis', '{seguir}'],//
    ['siguieron', '{seguir}'],//
    ['seguirán', '{seguir}'],
    ['seguiremos', '{seguir}'],
    ['seguirás', '{seguir}'],
    ['seguiré', '{seguir}'],
    ['seguirá', '{seguir}'],
    ['seguiréis', '{seguir}'],
    ['sigue', '{seguir}'],
    ['sigues', '{seguir}'],
    ['siguen', '{seguir}'],
    ['sigo', '{seguir}'],
    ['seguís', '{seguir}'],
    ['seguimos', '{seguir}'],
    ['seguiríamos', '{seguir}'],
    ['seguiría', '{seguir}'],
    ['seguiría', '{seguir}'],
    ['seguirían', '{seguir}'],
    ['seguirías', '{seguir}'],
    ['seguiríais', '{seguir}'],

    // [`no solo fue impactante.`, '{impactar}'],
    // [`disgustado por circunstancias`, '{desagradar}'],
    // [`Aprovecha el poder `, '{aprovechar}'],
    [`La incorporación estatutaria siguió`, '{estatutario}'],
    [`Está ahí para la exploración espacial`, '{exploración}'],
    [`Las 10 principales conversiones patrimoniales en Toronto`, '{conversión}'],
    [`una apelación oportuna.`, '{oportuno}'],
    [`Estamos viendo algunas señales alentadoras.`, '{alentador}'],
    [`Las líneas de preocupación aparecieron con la edad.`, '{preocupación}'],
    [`AGO Massive Party un espectáculo extraño y maravilloso`, '{espectáculo}'],
    [`Voy a usar el cojín.`, '{cojín}'],
    [`Los cojines son la esencia`, '{cojín}'],
    // [`republicanos que simplifiquen el sistema`, '{simplificar}'],
    // [`Las papas fritas estaban empapadas`, '{empapado}'],
    // [`Determina si has estado abusando del alcohol`, '{abusar}'],

    // [`Alguien me dijo que soy condescendiente.`, '{condescender}'],
    // [`Uno asesinado; 6 heridos en disputa familiar`, '{disputar}'],
    // [`no están maduras.`, '{mûr}'],
    [`Profundo en esa oscuridad mirando`, '{mirar}'],
    // [`Cualquiera puede decir cosas encantadoras y tratar de`, '{encantar}'],
    // [`la compañía se dispersó`, '{dispersarse}'],

    // reflexive forms
    [`irse`, '{ir}'],// (to leave)
    [`acordarse`, '{acordar}'],// (to remember)
    [`olvidarse`, '{olvidar}'],// (to forget)
    [`sentirse`, '{sentir}'],// (to feel)
    [`darse`, '{dar}'],// (to give oneself)
    [`encontrarse`, '{encontrar}'],// (to find oneself)
    [`preocuparse`, '{preocupar}'],// (to worry)
    [`fijarse`, '{fijar}'],// (to take notice)
    [`casarse`, '{casar}'],// (to marry)
    [`sentarse`, '{sentar}'],// (to sit down)
    [`levantarse`, '{levantar}'],// (to get up)
    [`despertarse`, '{despertar}'],// (to wake up oneself)
    [`preguntarse`, '{preguntar}'],// (to wonder)
    [`llamarse`, '{llamar}'],// (to call oneself)
    [`creerse`, '{creer}'],// (to believe)
    [`reunirse`, '{reunir}'],// (to meet up or reunite)
    [`cuidarse`, '{cuidar}'],// (to take care)
    ['relajarse', '{relajar}'],
    ['bañarme', '{bañar}'],
    ['vestirte', '{vestir}'],
    ['compondríamos', '{componer}'],
    // gerunds
    ['granulando', '{granular}'],
    ["combatiendo", "{combatir}"],
    ["dominando", "{dominar}"],
    ["capturando", "{capturar}"],
    ["proclamando", "{proclamar}"],
    ["bebiendo", "{beber}"],
    ["fumando", "{fumar}"],
    ["apareciendo", "{aparecer}"],
    ["obligando", "{obligar}"],
    ["disparando", "{disparar}"],

    // ['¡vámonos!', '{ir}'],
    // ['¡siéntense!', '{sentar}'],
    // ['acostándose', '{acostar}'],
    // ['vistiéndose', '{vestir}'],
    // ['duchándote', '{duchar}'],


  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str).compute('root')
    let tags = doc.json()[0].terms.map(term => term.tags[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    t.equal(doc.has(match), true, here + msg)
  })
  t.end()
})
