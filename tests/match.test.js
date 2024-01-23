import test from 'tape'
import nlp from './_lib.js'
let here = '[es-match] '
nlp.verbose(false)

test('match:', function (t) {
  let arr = [
    ['spencer', '#Person'],
    ['lloramos', '#Verb'],
    ['lloraríais', '#Verb'],
    ['lloraste', '#Verb'],
    ['lloráis', '#PresentTense'],
    ['junio', '#Month'],
    ['domingo', '#WeekDay'],
    ['234', '#Value'],
    ['chicago', '#City'],
    ['Jamaica', '#Country'],
    ['colorado', '#Place'],
    ['contra', '#Preposition'],
    ['y', '#Conjunction'],

    // present tense
    ['señalo', '(#PresentTense && #FirstPerson)'],
    ['señalas', '(#PresentTense && #SecondPerson)'],
    ['señalan', '(#PresentTense && #ThirdPersonPlural)'],
    // ['señalamos', '(#PresentTense && #FirstPersonPlural)'],
    ['señaláis', '(#PresentTense && #SecondPersonPlural)'],
    ['señala', '(#PresentTense && #ThirdPerson)'],

    // conditional
    ['señalaríamos', '(#Conditional && #FirstPersonPlural)'],
    ['señalaríais', '(#Conditional && #SecondPersonPlural)'],
    // ['señalaría', '(#Conditional && #FirstPerson)'],
    // ['señalaría', '(#Conditional && #ThirdPerson)'],
    ['señalarían', '(#Conditional && #ThirdPersonPlural)'],
    ['señalarías', '(#Conditional && #SecondPerson)'],

    // future
    ['señalaré', '(#FutureTense && #FirstPerson)'],
    ['señalarás', '(#FutureTense && #SecondPerson)'],
    ['señalará', '(#FutureTense && #ThirdPerson)'],
    ['señalaremos', '(#FutureTense && #FirstPersonPlural)'],
    ['señalaréis', '(#FutureTense && #SecondPersonPlural)'],
    ['señalarán', '(#FutureTense && #ThirdPersonPlural)'],

    // past
    ['señalé', '(#PastTense && #FirstPerson)'],
    ['señaló', '(#PastTense && #ThirdPerson)'],
    ['señalaste', '(#PastTense && #SecondPerson)'],
    ['señalamos', '#FirstPersonPlural'],
    ['señalasteis', '(#PastTense && #SecondPersonPlural)'],
    ['señalaron', '(#PastTense && #ThirdPersonPlural)'],

    ['asimilar', '#Verb'], // assimilate
    ['frenar', '#Verb'], // curb
    ['desafiar', '#Verb'], // defy
    ['diferenciar', '#Verb'], // differentiate
    ['desmantelar', '#Verb'], // dismantle
    ['gotear', '#Verb'], // drip
    ['supervisar', '#Verb'], // oversee
    ['estimular', '#Verb'], // stimulate

    ['divertido', '#Adjective'], // amusing
    ['anarquista', '#Adjective'], // anarchist
    ['dormido', '#Adjective'], // asleep
    ['atroz', '#Adjective'], // atrocious
    ['equilibrado', '#Adjective'], // balanced
    ['audaz', '#Adjective'], // bold
    ['aburrido', '#Adjective'], // boring
    ['encantador', '#Adjective'], // charming
    ['alegre', '#Adjective'], // cheerful
    ['cursi', '#Adjective'], // cheesy
    ['colorido', '#Adjective'], // colorful
    ['acogedor', '#Adjective'], // cozy
    ['atrevido', '#Adjective'], // daring
    ['muerto', '#Adjective'], // dead
    ['querido', '#Adjective'], // dear
    ['encantador', '#Adjective'], // delightful
    ['aburrido', '#Adjective'], // dull
    ['este', '#Adjective'], // east
    ['grasiento', '#Adjective'], // greasy
    ['agitado', '#Adjective'], // hectic
    ['infame', '#Adjective'], // infamous
    ['alegre', '#Adjective'], // jolly
    ['alegre', '#Adjective'], // joyful
    ['chiflado', '#Adjective'], // kooky
    ['menos', '#Adjective'], // least
    ['más', '#Adjective'], // more
    ['cerca', '#Adjective'], // near
    ['abrumador', '#Adjective'], // overwhelming
    ['depredador', '#Adjective'], // predatory
    ['prometedor', '#Adjective'], // promising
    ['independientemente', '#Adjective'], // regardless
    ['podrido', '#Adjective'], // rotten
    ['triste', '#Adjective'], // sad
    ['egoísta', '#Adjective'], // selfish
    ['mal', '#Adjective'], // shabby
    ['hábil', '#Adjective'], // skillful
    ['triste', '#Adjective'], // sorrowful
    ['sutil', '#Adjective'], // subtle
    ['agradecido', '#Adjective'], // thankful
    ['teórico', '#Adjective'], // theoretical
    ['cansado', '#Adjective'], // tired
    ['complicado', '#Adjective'], // tricky
    ['infeliz', '#Adjective'], // unhappy
    ['desconocido', '#Adjective'], // unknown
    ['inútil', '#Adjective'], // useless
    ['rico', '#Adjective'], // wealthy
    ['acogedor', '#Adjective'], // welcoming
    ['dispuesto', '#Adjective'], // willing-adjective

    ['aliado', '#Noun'], // ally
    ['antepasado', '#Noun'], // ancestor
    ['aniversario', '#Noun'], // anniversary
    ['solicitante', '#Noun'], // applicant
    ['baño', '#Noun'], // bathroom
    ['poco', '#Noun'], // bit
    ['puente', '#Noun'], // bridge
    ['amigo', '#Noun'], // buddy
    ['ciudadano', '#Noun'], // citizen
    // ["civil", "#Noun"],// civilian
    // ["primo", "#Noun"],// cousin
    ['cliente', '#Noun'], // customer
    ['daño', '#Noun'], // damage
    ['donante', '#Noun'], // donor
    ['sueño', '#Noun'], // dream
    ['empleado', '#Noun'], // employee
    ['inglés', '#Noun'], // english
    ['todos', '#Noun'], // everyone
    ['todo', '#Noun'], // everything
    ['ejercicio', '#Noun'], // exercise
    ['hada', '#Noun'], // fairy
    ['amigo', '#Noun'], // friend
    ['rana', '#Noun'], // frog
    ['juego', '#Noun'], // game
    ['guante', '#Noun'], // glove
    ['invernadero', '#Noun'], // greenhouse
    ['daño', '#Noun'], // harm
    ['aquí', '#Noun'], // here
    ['reino', '#Noun'], // kingdom
    ['caballero', '#Noun'], // knight
    ['falta', '#Noun'], // lack
    ['abogado', '#Noun'], // lawyer
    ['hígado', '#Noun'], // liver
    ['mayoría', '#Noun'], // majority
    ['mamífero', '#Noun'], // mammal
    ['gerente', '#Noun'], // manager
    ['mercado', '#Noun'], // market
    ['significado', '#Noun'], // meaning
    ['miembro', '#Noun'], // member
    ['mezcla', '#Noun'], // mixture
    ['dinero', '#Noun'], // money
    ['mito', '#Noun'], // myth
    ['vecino', '#Noun'], // neighbour
    ['ahora', '#Noun'], // now
    ['resultado', '#Noun'], // outcome
    ['pasajero', '#Noun'], // passenger
    ['camino', '#Noun'], // path
    ['pago', '#Noun'], // payment
    ['farmacéutico', '#Noun'], // pharmacist
    ['peregrino', '#Noun'], // pilgrim
    ['propósito', '#Noun'], // purpose
    ['cuerda', '#Noun'], // rope
    ['ensalada', '#Noun'], // salad
    ['sirviente', '#Noun'], // servant
    ['lado', '#Noun'], // side
    ['tamaño', '#Noun'], // size
    ['esclavo', '#Noun'], // slave
    ['serpiente', '#Noun'], // snake
    ['alguien', '#Noun'], // someone
    ['algo', '#Noun'], // something
    ['fuente', '#Noun'], // source
    ['personal', '#Noun'], // staff
    // ['estado', '#Noun'], // state
    ['paso', '#Noun'], // step
    ['éxito', '#Noun'], // success
    ['contribuyente', '#Noun'], // taxpayer
    ['técnica', '#Noun'], // technique
    ['teoría', '#Noun'], // theory
    ['umbral', '#Noun'], // threshold
    ['diente', '#Noun'], // tooth
    ['tratado', '#Noun'], // treaty
    ['gemelo', '#Noun'], // twin
    ['usuario', '#Noun'], // user
    ['votante', '#Noun'], // voter
    ['salario', '#Noun'], // wage
    ['peso', '#Noun'], // weight
    ['esposa', '#Noun'], // wife
    ['vino', '#Noun'], // wine
    ['mago', '#Noun'], // wizard
    ['año', '#Noun'], // year
    ['ayer', '#Noun'], // yesterday
    ['agregar', '#Verb'], //add
    ['promedio', '#Adjective'], //average
    ['quiebra', '#Noun'], //bankruptcy
    ['amado', '#Adjective'], //beloved
    ['traicionar', '#Verb'], //betray
    ['reforzar', '#Verb'], //bolster
    ['carga', '#Noun'], //burden
    ['chatear', '#Verb'], //chat
    ['niño', '#Noun'], //child
    ['chasquear', '#Verb'], //click
    ['cerrado', '#Adjective'], //closed
    ['datos', '#Noun'], //data
    ['despreciar', '#Verb'], //despise
    ['decepcionar', '#Verb'], //disappoint
    ['descargar', '#Verb'], //download
    ['enfatizar', '#Verb'], //emphasize
    ['respaldar', '#Verb'], //endorse
    ['entusiasta', '#Adjective'], //enthusiastic
    ['estallar', '#Verb'], //erupt
    ['escapar', '#Verb'], //escape
    ['evocar', '#Verb'], //evoke
    ['falla', '#Noun'], //flaw
    ['vuelo', '#Noun'], //flight
    ['helado', '#Adjective'], //frosty
    ['invitado', '#Noun'], //guest
    ['eclosionar', '#Verb'], //hatch
    ['encabezado', '#Noun'], //heading
    ['encabezado', '#Noun'], //headline
    ['agujero', '#Noun'], //hole
    ['hambre', '#Adjective'], //hungry
    ['incentivo', '#Noun'], //incentive
    ['pulgada', '#Noun'], //inch
    ['niño', '#Noun'], //kid
    ['señor', '#Noun'], //lord
    ['almuerzo', '#Noun'], //lunch
    ['feliz', '#Adjective'], //merry
    ['malversar', '#Verb'], //misappropriate
    ['mitigar', '#Verb'], //mitigate
    ['mono', '#Verb'], //monkey
    ['vecindario', '#Noun'], //neighborhood
    ['periódico', '#Noun'], //newspaper
    ['nada', '#Noun'], //nothing
    ['ordenado', '#Adjective'], //orderly
    ['otro', '#Noun'], //other
    ['resumen', '#Noun'], //overview
    ['patente', '#Noun'], //patent
    ['practico', '#Adjective'], //practical
    ['embarazado', '#Adjective'], //pregnant
    ['cura', '#Noun'], //priest
    ['prueba', '#Noun'], //proof
    ['prospecto', '#Noun'], //prospect
    ['morado', '#Adjective'], //purple
    ['reaccionar', '#Verb'], //react
    ['cosechar', '#Verb'], //reap
    ['refinado', '#Adjective'], //refined
    ['reembolsar', '#Verb'], //reimburse
    ['resumen', '#Noun'], //resume
    ['arriesgado', '#Adjective'], //risky
    ['muestra', '#Noun'], //sample
    ['aterrador', '#Adjective'], //scary
    ['estante', '#Noun'], //shelf
    ['suspiro', '#Noun'], //sigh
    ['arrepentido', '#Adjective'], //sorry
    ['sofocar', '#Verb'], //stifle
    ['puntada', '#Noun'], //stitch
    ['sobreviviente', '#Noun'], //survival
    ['encargar', '#Verb'], //task
    ['ordenado', '#Adjective'], //tidy
    ['neumático', '#Noun'], //tire
    ['prueba', '#Noun'], //trial
    ['descargar', '#Verb'], //unload
    ['desvelar', '#Verb'], //unveil
    ['vegetal', '#Noun'], //vegetable
    ['debil', '#Adjective'], //weak
    ['encima', '#Adjective'], //above
    ['agregar', '#Verb'], //add
    ['enmendar', '#Verb'], //amend
    ['enojado', '#Adjective'], //angry
    ['promedio', '#Adjective'], //average
    ['traicionar', '#Verb'], //betray
    ['bota', '#Noun'], //boot
    ['estallar', '#Verb'], //burst
    ['cerrado', '#Adjective'], //closed
    ['coleccionar', '#Verb'], //collect
    ['primo', '#Noun'], //cousin
    ['gatear', '#Verb'], //crawl
    ['anticuado', '#Adjective'], //dated
    ['retrasar', '#Verb'], //delay
    ['entrega', '#Noun'], //delivery
    ['despreciar', '#Verb'], //despise
    ['detallar', '#Verb'], //detail
    ['desprovisto', '#Adjective'], //devoid
    ['decepcionar', '#Verb'], //disappoint
    ['esquivar', '#Verb'], //dodge
    ['descargar', '#Verb'], //download
    ['animar', '#Verb'], //encourage
    ['exhumar', '#Verb'], //exhume
    ['expulsar', '#Verb'], //expel
    ['grado', '#Noun'], //extent
    // ['de moda', '#Adjective'],  //fashionable
    ['aficionado', '#Adjective'], //fond
    ['asar', '#Verb'], //grill
    ['invitado', '#Noun'], //guest
    ['habito', '#Noun'], //habit
    ['obstaculizar', '#Verb'], //hamper
    ['encabezado', '#Noun'], //headline
    ['perfeccionar', '#Verb'], //hone
    ['pulgada', '#Noun'], //inch
    ['animado', '#Adjective'], //lively
    ['elevado', '#Adjective'], //lofty
    ['almuerzo', '#Noun'], //lunch
    ['maximizar', '#Verb'], //maximize
    ['desordenado', '#Adjective'], //messy
    ['vecindario', '#Noun'], //neighborhood
    ['periódico', '#Noun'], //newspaper
    ['oponente', '#Noun'], //opponent
    ['resumen', '#Noun'], //overview
    ['pellizcar', '#Verb'], //pinch
    ['poblado', '#Adjective'], //populous
    ['embarazado', '#Adjective'], //pregnant
    ['enjuiciar', '#Verb'], //prosecute
    ['proporcionar', '#Verb'], //provide
    ['morado', '#Adjective'], //purple
    ['reaccionar', '#Verb'], //react
    ['cosechar', '#Verb'], //reap
    ['refinado', '#Adjective'], //refined
    ['reflexionar', '#Verb'], //reflect
    ['reflejar', '#Verb'], //reflect
    ['reembolsar', '#Verb'], //reimburse
    ['reemplazar', '#Verb'], //replace
    ['resumen', '#Noun'], //resume
    ['arriesgado', '#Adjective'], //risky
    ['muestra', '#Noun'], //sample
    ['erudito', '#Noun'], //scholar
    ['sellar', '#Verb'], //seal
    ['estante', '#Noun'], //shelf
    ['estornudar', '#Verb'], //sneeze
    ['sollozar', '#Verb'], //sob
    ['estropear', '#Verb'], //spoil
    ['subvencionar', '#Verb'], //subsidize
    ['adecuado', '#Adjective'], //suitable
    ['sobreviviente', '#Noun'], //survival
    ['testificar', '#Verb'], //testify
    ['prosperando', '#Adjective'], //thriving
    ['hoy', '#Noun'], //today
    ['desencadenar', '#Verb'], //trigger
    ['socavar', '#Verb'], //undermine
    ['descargar', '#Verb'], //unload
    ['validar', '#Verb'], //validate
    ['silbar', '#Verb'], //whistle
    ['extendido', '#Adjective'], //widespread

    ['ficticios', '#Adjective'], //fictional
    ['miembros', '#Plural'], //members
    ['bruscos', '#Adjective'], //abrupt
    ['ganadera', '#Noun'], //livestock
    ['china', '#Place'],
    ['vegetal', '#Noun'],
    ['argentina', '#Country'],
    ['limítrofes', '#Adjective'], //bordering
    ['ho chi minh', '#City+'],

    [`He comprado los medicamentos.`, '#Auxiliary #Verb #Determiner #Plural'], //(I have bought the medicine.)
    [
      `Anda pensando en la fiesta de graduación.`,
      '#Auxiliary #Gerund #Preposition #Determiner #Noun #Preposition #Noun'
    ], //(He goes about thinking about the graduation party.)
    [`Estamos celebrando.`, '#Auxiliary #Gerund'], //(We are celebrating.)
    [`No trabaja.`, '#Negative #Verb'], //(He does not work.)
    [
      `No saldré hasta mañana por la tarde.`,
      '#Negative #Verb #Preposition #Noun #Preposition #Determiner #Noun'
    ], //(I will not leave until tomorrow afternoon.)
    [`Puedo nadar.`, '#Auxiliary #Verb'], //(I can swim.)
    [
      `Los que pararon de fumar tuvieron un incremento de peso.`,
      'los que #Auxiliary de #Verb #Verb #Determiner . #Preposition #Noun'
    ], //(Those who quit smoking gained weight.)
    [`Suelo manejar rápido.`, '#Auxiliary #Verb #Adjective'], //(I usually drive fast.)

    ['Ella nunca corre.', '#Pronoun #Negative #PresentTense'],
    // contractions
    ['Ella va al cine todos los viernes.', '#Pronoun #Verb a el #Noun todos #Determiner #Noun'], //She goes to the movie theater every Friday.
    [
      'Te espero al final de la cola.',
      '#Pronoun #Verb #Preposition #Determiner #Noun #Preposition #Determiner #Noun'
    ],
    ['Tú expandes tu negocio.', '#Pronoun #Verb #Possessive #Noun']
    // ['', ''],
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str) //.compute('tagRank')
    let tags = doc.json()[0].terms.map((term) => term.tags[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    let m = doc.match(match)
    t.equal(m.text(), doc.text(), here + msg)
  })
  t.end()
})
