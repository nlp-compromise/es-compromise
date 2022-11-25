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


    ["asimilar", "#Verb"],// assimilate
    ["frenar", "#Verb"],// curb
    ["desafiar", "#Verb"],// defy
    ["diferenciar", "#Verb"],// differentiate
    ["desmantelar", "#Verb"],// dismantle
    ["gotear", "#Verb"],// drip
    ["supervisar", "#Verb"],// oversee
    ["estimular", "#Verb"],// stimulate

    ["divertido", "#Adjective"],// amusing
    ["anarquista", "#Adjective"],// anarchist
    ["dormido", "#Adjective"],// asleep
    ["atroz", "#Adjective"],// atrocious
    ["equilibrado", "#Adjective"],// balanced
    ["audaz", "#Adjective"],// bold
    ["aburrido", "#Adjective"],// boring
    ["encantador", "#Adjective"],// charming
    ["alegre", "#Adjective"],// cheerful
    ["cursi", "#Adjective"],// cheesy
    ["colorido", "#Adjective"],// colorful
    ["acogedor", "#Adjective"],// cozy
    ["atrevido", "#Adjective"],// daring
    ["muerto", "#Adjective"],// dead
    ["querido", "#Adjective"],// dear
    ["encantador", "#Adjective"],// delightful
    ["aburrido", "#Adjective"],// dull
    ["este", "#Adjective"],// east
    ["grasiento", "#Adjective"],// greasy
    ["agitado", "#Adjective"],// hectic
    ["infame", "#Adjective"],// infamous
    ["alegre", "#Adjective"],// jolly
    ["alegre", "#Adjective"],// joyful
    ["chiflado", "#Adjective"],// kooky
    ["menos", "#Adjective"],// least
    ["más", "#Adjective"],// more
    ["cerca", "#Adjective"],// near
    ["abrumador", "#Adjective"],// overwhelming
    ["depredador", "#Adjective"],// predatory
    ["prometedor", "#Adjective"],// promising
    ["independientemente", "#Adjective"],// regardless
    ["podrido", "#Adjective"],// rotten
    ["triste", "#Adjective"],// sad
    ["egoísta", "#Adjective"],// selfish
    ["mal", "#Adjective"],// shabby
    ["hábil", "#Adjective"],// skillful
    ["triste", "#Adjective"],// sorrowful
    ["sutil", "#Adjective"],// subtle
    ["agradecido", "#Adjective"],// thankful
    ["teórico", "#Adjective"],// theoretical
    ["cansado", "#Adjective"],// tired
    ["complicado", "#Adjective"],// tricky
    ["infeliz", "#Adjective"],// unhappy
    ["desconocido", "#Adjective"],// unknown
    ["inútil", "#Adjective"],// useless
    ["rico", "#Adjective"],// wealthy
    ["acogedor", "#Adjective"],// welcoming
    ["dispuesto", "#Adjective"],// willing-adjective

    ["aliado", "#Noun"],// ally
    ["antepasado", "#Noun"],// ancestor
    ["aniversario", "#Noun"],// anniversary
    ["solicitante", "#Noun"],// applicant
    ["activo", "#Noun"],// asset
    ["baño", "#Noun"],// bathroom
    ["poco", "#Noun"],// bit
    ["puente", "#Noun"],// bridge
    ["amigo", "#Noun"],// buddy
    ["ganado", "#Noun"],// cattle
    ["ciudadano", "#Noun"],// citizen
    // ["civil", "#Noun"],// civilian
    // ["primo", "#Noun"],// cousin
    ["cliente", "#Noun"],// customer
    ["daño", "#Noun"],// damage
    ["donante", "#Noun"],// donor
    ["sueño", "#Noun"],// dream
    ["empleado", "#Noun"],// employee
    ["inglés", "#Noun"],// english
    ["todos", "#Noun"],// everyone
    ["todo", "#Noun"],// everything
    ["ejercicio", "#Noun"],// exercise
    ["hada", "#Noun"],// fairy
    ["amigo", "#Noun"],// friend
    ["rana", "#Noun"],// frog
    ["juego", "#Noun"],// game
    ["guante", "#Noun"],// glove
    ["invernadero", "#Noun"],// greenhouse
    ["daño", "#Noun"],// harm
    ["aquí", "#Noun"],// here
    ["reino", "#Noun"],// kingdom
    ["caballero", "#Noun"],// knight
    ["falta", "#Noun"],// lack
    ["abogado", "#Noun"],// lawyer
    ["hígado", "#Noun"],// liver
    ["ganado", "#Noun"],// livestock
    ["mayoría", "#Noun"],// majority
    ["mamífero", "#Noun"],// mammal
    ["gerente", "#Noun"],// manager
    ["mercado", "#Noun"],// market
    ["significado", "#Noun"],// meaning
    ["miembro", "#Noun"],// member
    ["mezcla", "#Noun"],// mixture
    ["dinero", "#Noun"],// money
    ["mito", "#Noun"],// myth
    ["vecino", "#Noun"],// neighbour
    ["ahora", "#Noun"],// now
    ["oficial", "#Noun"],// officer
    ["resultado", "#Noun"],// outcome
    ["pasajero", "#Noun"],// passenger
    ["camino", "#Noun"],// path
    ["pago", "#Noun"],// payment
    ["farmacéutico", "#Noun"],// pharmacist
    ["peregrino", "#Noun"],// pilgrim
    ["propósito", "#Noun"],// purpose
    ["cuerda", "#Noun"],// rope
    ["ensalada", "#Noun"],// salad
    ["científico", "#Noun"],// scientist
    ["sirviente", "#Noun"],// servant
    ["lado", "#Noun"],// side
    ["tamaño", "#Noun"],// size
    ["esclavo", "#Noun"],// slave
    ["serpiente", "#Noun"],// snake
    ["alguien", "#Noun"],// someone
    ["algo", "#Noun"],// something
    ["fuente", "#Noun"],// source
    ["personal", "#Noun"],// staff
    ["estado", "#Noun"],// state
    ["paso", "#Noun"],// step
    ["éxito", "#Noun"],// success
    ["contribuyente", "#Noun"],// taxpayer
    ["técnica", "#Noun"],// technique
    ["teoría", "#Noun"],// theory
    ["umbral", "#Noun"],// threshold
    ["diente", "#Noun"],// tooth
    ["tratado", "#Noun"],// treaty
    ["gemelo", "#Noun"],// twin
    ["usuario", "#Noun"],// user
    ["votante", "#Noun"],// voter
    ["salario", "#Noun"],// wage
    ["peso", "#Noun"],// weight
    ["esposa", "#Noun"],// wife
    ["vino", "#Noun"],// wine
    ["mago", "#Noun"],// wizard
    ["año", "#Noun"],// year
    ["ayer", "#Noun"],// yesterday

    // ['', ''],
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str)//.compute('tagRank')
    let tags = doc.json()[0].terms.map(term => term.tags[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    let m = doc.match(match)
    t.equal(m.text(), doc.text(), here + msg)
  })
  t.end()
})
