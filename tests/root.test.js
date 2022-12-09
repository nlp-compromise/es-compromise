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

    ["Olvidas tu cumpleaños", "{olvidar}"], //verb
    ["nos olvidamos muchas veces", "{olvidar}"],
    ["las ligas menores", "{menor}"], //adj
    ["las capacidades que Dios les ha dado", "{capacidad}"], // noun
    ["contemplaciones", "{contemplación}"], // noun


    // noun
    ['Estamos recibiendo facturas de Ace Federal', '{factura}'],
    ['trabajadores de las sombras', '{sombra}'],
    ['Las sombras caen por toda', '{sombra}'],
    ['su debut en Grandes Ligas', '{liga}'],

    //adjectives
    // ['La diplomacia avanzada', '{avanzado}'],
    ['que las principales economías avanzadas', '{avanzado}'],
    ['una cerilla descuidada', '{descuidado}'],
    ['las perreras más estrechas', '{estrecho}'],
    ['una estrecha victoria ', '{estrecho}'],
    ['un acto defensivo estratégico', '{defensivo}'],
    ['en direcciones opuestas', '{opuesto}'],
    ['una situación conmovedora', '{conmovedor}'],
    ['La delgada atmósfera', '{delgado}'],
    ['en tierra delgada', '{delgado}'],
    ['La forma era delgada', '{delgado}'],

    //verbs
    ['no quiero quemarme', '{quemar}'],
    ['o te comeré', '{comer}'],
    // ['Coma muchas comidas ', '{comer}'], //subjunctive
    ['comiendo pasteles dulces ', '{comer}'],
    ['lo he ganado dos veces', '{ganar}'],
    ['me gané la mía depilando', '{ganar}'],
    ['me ganará el veto', '{ganar}'],
    ['de resina personalizadas que mejoran la capacidad', '{mejorar}'],
    ['No exageres', '{exagerar}'],
    ['he matado a tu enemigo', '{matar}'],
    ['no matan a la gente', '{matar}'],
    ['los mató de un solo golpe', '{matar}'],
    ['Mezcle un lantadyme limpio ', '{mezclar}'],
    ['y mezclarlo con ron ', '{mezclar}'],
    ['hasta que abordemos la crisis', '{abordar}'],
    ['mucho viento no prosperan', '{prosperar}'],
    ['prospera en altitudes', '{prosperar}'],
    ['las pocas plantas que prosperan', '{prosperar}'],
    ['el gobierno nunca debe socavarlos.', '{socavar}'],
    ['hace que se destruyan cuando', '{destruir}'],
    ['Los griegos lloraron profundamente ', '{llorar}'],
    ['llorando por su hijo ', '{llorar}'],
    ['un agente secreto retirado que llora el asesinato ', '{llorar}'],

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
