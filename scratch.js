import nlp from './src/index.js'

// nlp.verbose('tagger')
/*
0.0.2 - tagger 87%
*/

// import verbs from '/Users/spencer/mountain/es-compromise/data/models/verb/present-tense.js'
// Object.keys(verbs).forEach(k => {
//   let arr = verbs[k]
//   arr.forEach(str => {
//     let doc = nlp(str)
//     doc.compute('root')
//     if (!doc.has(`{${k}}`)) {
//       console.log(k, str)
//     }
//   })
// })



let txt = 'Sí, sabes que ya llevo un rato mirándote. Tengo que bailar contigo hoy'


// 'automático' [j]
txt = `Apague las puertas automáticas.`
txt = `Identifica tus pensamientos negativos automáticos.`

// 'trágico' [j]
txt = `Intentaron hacerlo trágico.`
txt = `Trágico y épico y tan increíble`
txt = `Un trágico desperdicio`

// 'avion' [n]
txt = `Teherán obtiene una hamburguesería con temática de aviones`
txt = `Estos aviones se retiraron`

//  'expirar' [v]
txt = `El mandato expirará el 1 de noviembre de 1938.`

//  'neumático'
txt = `Tracción en las cuatro ruedas y grandes neumáticos para barro,`

//  'elevar' [v]
txt = `It's Not U It's Me está elevando la escena de fiesta de Austin`
txt = `Plataforma elevada en la que se ejecuta un criminal convicto`
txt = `Gran cantidad de tiempo perdido y presión arterial elevada.`

//  'clasificación'[n]
txt = `La clasificación de enfermedades`


//  'absorber' [v]
txt = `Pronto ambos estamos profundamente absortos en la película.`


// 'popularizar'
txt = `Película de 1996 que popularizó líneas como "Eres dinero, bebé".`
txt = `Madonna popularizó los términos "Material Girl"`


// 'claustrofóbico'
txt = `Tengo miedo de Santa-- Debo ser claustrofóbico`
txt = `Era un pasillo pequeño y claustrofóbico con un bar.`

// 'torturar'
txt = `Tortúrame, dijo el masoquista.`
// txt = `¿Por qué la CIA torturó a la avispa rusa?`
// txt = `Intenta no torturarte leyendo los comentarios.`
// txt = `Cuando te torturo `

//  'estúpido' [j]
// txt = `Díselo a los jóvenes estúpidos.`
// txt = `Tomemos una historia completamente estúpida.`
// txt = `¡Chuck Norris es un actor estúpido!`
// txt = `¡Pues es una pregunta estúpida e injusta!`

// 'compañero' [n]
// txt = `El compañero que se ve aquí es nativo de este continente.`

//  'pinta'
// txt = `¿Qué es azul y viene en pintas? Una ballena.`
// txt = `¿3 pintas de cerveza?`


// 'útil'
// txt = `Entiende que la preocupación puede ser útil.`
// txt = `Espero que hayas encontrado útil esta información.`
// txt = `Llamé y el representante Ian Shogren fue muy útil.`

//  'coctel'
// txt = `Los 5 mejores cócteles de sidra en Dinamarca`
// txt = `Los 10 mejores nuevos bares de cócteles en Toronto`

//  'calcetín'
// txt = `Mi próximo retador es un calcetín verde.`
// txt = `¿Y qué es un lugar coreano sin calcetines ($2-3/cada uno).`
// txt = `Estaba en tus bolsos y calcetines, y los piojos siempre estaban`

// 'electrón'
// txt = `¿Cómo se pueden emparejar electrones sin iones que los mantengan juntos, lo que permite un superconductor de mayor`

txt = ' ¡Vámonos!'
txt = ' ¡Siéntense!'
txt = ' Acaba de irse.'
txt = 'acostándose'
txt = 'vistiéndose'
// txt = 'Acostándose'
// txt = 'bañarme'
// txt = 'vestirte'
// txt = 'vistiéndose'
// txt = 'duchándote'
// txt = ' a quejarse de dolores'

// Está vistiéndose or Se está vistiendo.

let doc = nlp(txt)
doc.compute('root')
doc.match('{vestir}').debug()
doc.debug()
console.log(doc.docs[0])
// doc.numbers().minus(50)
// doc.text()
// tengo moins diez dolares
