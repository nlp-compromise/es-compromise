import test from 'tape'
import nlp from './_lib.js'
let here = '[root-match] '
nlp.verbose(false)

test('root-match:', function (t) {
  let arr = [
    ['tiramos nuestros zapatos', '{tirar} nuestros {zapato}'],
    // verb toRoots
    ['seguir', '{seguir}'], //same
    ['seguí', '{seguir}'], //
    ['seguiste', '{seguir}'], //
    ['siguió', '{seguir}'], //
    ['seguimos', '{seguir}'], //
    ['seguisteis', '{seguir}'], //
    ['siguieron', '{seguir}'], //
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
    [`irse`, '{ir}'], // (to leave)
    [`acordarse`, '{acordar}'], // (to remember)
    [`olvidarse`, '{olvidar}'], // (to forget)
    [`sentirse`, '{sentir}'], // (to feel)
    [`darse`, '{dar}'], // (to give oneself)
    [`encontrarse`, '{encontrar}'], // (to find oneself)
    [`preocuparse`, '{preocupar}'], // (to worry)
    [`fijarse`, '{fijar}'], // (to take notice)
    [`casarse`, '{casar}'], // (to marry)
    [`sentarse`, '{sentar}'], // (to sit down)
    [`levantarse`, '{levantar}'], // (to get up)
    [`despertarse`, '{despertar}'], // (to wake up oneself)
    [`preguntarse`, '{preguntar}'], // (to wonder)
    [`llamarse`, '{llamar}'], // (to call oneself)
    [`creerse`, '{creer}'], // (to believe)
    [`reunirse`, '{reunir}'], // (to meet up or reunite)
    [`cuidarse`, '{cuidar}'], // (to take care)
    ['relajarse', '{relajar}'],
    ['bañarme', '{bañar}'],
    ['vestirte', '{vestir}'],
    ['compondríamos', '{componer}'],
    // gerunds
    ['granulando', '{granular}'],
    ['combatiendo', '{combatir}'],
    ['dominando', '{dominar}'],
    ['capturando', '{capturar}'],
    ['proclamando', '{proclamar}'],
    ['bebiendo', '{beber}'],
    ['fumando', '{fumar}'],
    ['apareciendo', '{aparecer}'],
    ['obligando', '{obligar}'],
    ['disparando', '{disparar}'],

    // ['¡vámonos!', '{ir}'],
    // ['¡siéntense!', '{sentar}'],
    // ['acostándose', '{acostar}'],
    // ['vistiéndose', '{vestir}'],
    // ['duchándote', '{duchar}'],

    ['Olvidas tu cumpleaños', '{olvidar}'], //verb
    ['nos olvidamos muchas veces', '{olvidar}'],
    ['las ligas menores', '{menor}'], //adj
    ['las capacidades que Dios les ha dado', '{capacidad}'], // noun
    ['contemplaciones', '{contemplación}'], // noun

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
    ['una estrecha victoria', '{estrecho}'],
    ['un acto defensivo estratégico', '{defensivo}'],
    ['en direcciones opuestas', '{opuesto}'],
    ['una situación conmovedora', '{conmovedor}'],
    ['La delgada atmósfera', '{delgado}'],
    ['en tierra delgada', '{delgado}'],
    ['La forma era delgada', '{delgado}'],

    //verbs
    ['o te comeré', '{comer}'],
    ['comiendo pasteles dulces', '{comer}'],
    ['lo he ganado dos veces', '{ganar}'],
    ['me gané la mía depilando', '{ganar}'],
    ['me ganará el veto', '{ganar}'],
    ['de resina personalizadas que mejoran la capacidad', '{mejorar}'],
    ['he matado a tu enemigo', '{matar}'],
    ['no matan a la gente', '{matar}'],
    ['los mató de un solo golpe', '{matar}'],
    // ['no quiero quemarme', '{quemar}'], //what form is this?
    // ['y mezclarlo con ron', '{mezclar}'], // what form is this?
    // ['el gobierno nunca debe socavarlos.', '{socavar}'], // what is this?
    ['mucho viento no prosperan', '{prosperar}'],
    ['prospera en altitudes', '{prosperar}'],
    ['las pocas plantas que prosperan', '{prosperar}'],
    ['Los griegos lloraron profundamente', '{llorar}'],
    ['llorando por su hijo', '{llorar}'],
    ['un agente secreto retirado que llora el asesinato', '{llorar}'],
    // subjunctive
    ['ganemos', '{ganar}'],
    ['Coma muchas comidas', '{comer}'], //subjunctive
    ['No exageres', '{exagerar}'], //subjunctive
    // imperative
    ['ganen', '{ganar}'],
    ['Mezcle un lantadyme limpio', '{mezclar}'], //imperative
    ['hace que se destruyan cuando', '{destruir}'], //imperative
    ['hasta que abordemos la crisis', '{abordar}'], //imperative

    ['Él camina por el parque.', '{caminar}'],
    ['Nosotros estudiamos para el examen.', '{estudiar}'],
    ['Ella cocina una paella.', '{cocinar}'],
    ['Los niños juegan en el jardín.', '{jugar}'],
    ['Yo escribo una carta.', '{escribir}'],
    ['Ellos cantan en la fiesta.', '{cantar}'],
    ['Las chicas bailan en la discoteca.', '{bailar}'],
    ['Tú vendes tu coche.', '{vender}'],
    ['Él trabaja en una tienda.', '{trabajar}'],
    ['Nosotros vivimos en Madrid.', '{vivir}'],
    ['Yo corro por la mañana.', '{correr}'],
    ['Ella pinta un cuadro.', '{pintar}'],
    ['Ellos escuchan música.', '{escuchar}'],
    ['Tú hablas por teléfono.', '{hablar}'],
    ['Nosotras leemos un libro.', '{leer}'],
    ['El perro duerme en la cama.', '{dormir}'],
    ['Tú comes una ensalada.', '{comer}'],
    ['Yo miro la televisión.', '{mirar}'],
    ['Ellos nadan en la piscina.', '{nadar}'],
    ['Ella viaja por el mundo.', '{viajar}'],
    ['Nosotros plantamos un árbol.', '{plantar}'],
    ['Tú decides el menú.', '{decidir}'],
    ['Él construye una casa.', '{construir}'],
    ['Nosotros aprendemos francés.', '{aprender}'],
    ['Yo vendo ropa.', '{vender}'],
    ['Ellos beben agua.', '{beber}'],
    ['Tú corres en el parque.', '{correr}'],
    ['Ella traduce el documento.', '{traducir}'],
    ['Nosotros comemos pasta.', '{comer}'],
    ['Ellos piden ayuda.', '{pedir}'],
    ['Yo compro un billete.', '{comprar}'],
    ['El gato duerme en el sofá.', '{dormir}'],
    ['Tú vives en Barcelona.', '{vivir}'],
    ['Nosotros compartimos la comida.', '{compartir}'],
    ['Ella abre la ventana.', '{abrir}'],
    ['Tú cierras la puerta.', '{cerrar}'],
    ['Yo recuerdo ese momento.', '{recordar}'],
    ['Ellos limpian la casa.', '{limpiar}'],
    ['Nosotros preparamos la cena.', '{preparar}'],
    ['Ella enseña matemáticas.', '{enseñar}'],
    ['Yo respondo las preguntas.', '{responder}'],
    ['Ellos bailan salsa.', '{bailar}'],
    ['Nosotros practicamos deporte.', '{practicar}'],
    ['Ella canta en la ducha.', '{cantar}'],
    ['Yo busco mi llave.', '{buscar}'],
    ['Ellos asisten a la clase.', '{asistir}'],
    ['Tú piensas en el futuro.', '{pensar}'],
    ['Yo tomo un café.', '{tomar}'],
    ['Ellos esperan el autobús.', '{esperar}'],

    ['Ella conduce el coche.', '{conducir}'],
    ['Nosotros brindamos por el éxito.', '{brindar}'],
    ['Yo planto flores en el jardín.', '{plantar}'],
    ['Ellos alquilan un apartamento.', '{alquilar}'],
    ['Tú enseñas tu nuevo vestido.', '{enseñar}'],
    ['Nosotros volvemos a casa.', '{volver}'],
    ['Ella espera el tren.', '{esperar}'],
    ['Yo descubro un libro interesante.', '{descubrir}'],
    ['Ellos envían una carta.', '{enviar}'],
    ['Tú celebras tu cumpleaños.', '{celebrar}'],
    ['Nosotros elegimos la película.', '{elegir}'],
    ['Yo inicio mi trabajo a las ocho.', '{iniciar}'],
    ['Ellos asisten al concierto.', '{asistir}'],
    ['Tú olvidas tus llaves.', '{olvidar}'],
    ['Ella recibe un regalo.', '{recibir}'],
    ['Yo subo la escalera.', '{subir}'],
    ['Nosotros reducimos el gasto.', '{reducir}'],
    ['Tú sugieres una idea.', '{sugerir}'],
    ['Ellos producen un sonido.', '{producir}'],
    ['Nosotros atendemos el seminario.', '{atender}'],
    ['Yo protejo al niño.', '{proteger}'],
    ['Ella rechaza la oferta.', '{rechazar}'],
    ['Tú recoges a tus amigos.', '{recoger}'],
    ['Nosotros mantenemos la calma.', '{mantener}'],
    ['Ellos introducen un cambio.', '{introducir}'],
    ['Yo aplaudo la presentación.', '{aplaudir}'],
    ['Tú expandes tu negocio.', '{expandir}'],
    ['Nosotros resolvemos el problema.', '{resolver}'],
    ['Ella absorbe la información.', '{absorber}'],
    ['Ellos intercambian opiniones.', '{intercambiar}'],
    ['Yo refresco la página.', '{refrescar}'],
    ['Nosotros añadimos sal.', '{añadir}'],
    ['Ellos celebran el aniversario.', '{celebrar}'],
    ['Yo detengo el coche.', '{detener}'],
    ['Ella ilumina la habitación.', '{iluminar}'],
    ['Tú abandonas la idea.', '{abandonar}'],
    ['Nosotros multiplicamos los números.', '{multiplicar}'],
    ['Ellos cargan las maletas.', '{cargar}'],
    ['Yo ajusto el reloj.', '{ajustar}'],
    ['Ella organiza el evento.', '{organizar}'],
    ['Nosotros distribuimos las tareas.', '{distribuir}'],
    ['Yo agradezco tu ayuda.', '{agradecer}'],
    ['Ellos capturan la imagen.', '{capturar}'],
    ['Tú depositas dinero.', '{depositar}'],
    ['Nosotros revelamos el secreto.', '{revelar}'],
    ['Yo establezco la conexión.', '{establecer}'],
    ['Ellos construyen un puente.', '{construir}'],
    ['Tú conservas la energía.', '{conservar}'],
    ['Ella alcanza la cima.', '{alcanzar}'],
    ['Yo confundo los nombres.', '{confundir}'],
    ['Nosotros dividimos el pastel.', '{dividir}'],
    ['Ellos enfrentan el reto.', '{enfrentar}'],
    ['Tú integras el equipo.', '{integrar}'],
    ['Ella invierte en acciones.', '{invertir}'],
    ['Nosotros adquirimos conocimientos.', '{adquirir}'],
    ['Yo apruebo el examen.', '{aprobar}'],
    ['Ellos colaboran en el proyecto.', '{colaborar}'],
    ['Tú recuerdas el pasado.', '{recordar}'],
    ['Nosotros defendemos nuestros derechos.', '{defender}'],
    ['Ella facilita el proceso.', '{facilitar}'],
    ['Yo ocupo el asiento.', '{ocupar}'],
    ['Ellos operan la maquinaria.', '{operar}'],
    ['Tú combinas colores.', '{combinar}'],
    ['Nosotros superamos obstáculos.', '{superar}'],
    ['Ella promueve el producto.', '{promover}'],
    ['Ellos reflejan la luz.', '{reflejar}'],
    ['Yo inspiro confianza.', '{inspirar}'],
    ['Tú determinas el rumbo.', '{determinar}'],
    ['Nosotros valoramos la amistad.', '{valorar}'],

    ['Nosotros apreciamos el arte.', '{apreciar}'],
    ['Ellos desarrollan una aplicación.', '{desarrollar}'],
    ['Tú designas al líder.', '{designar}'],
    ['Ella descansa en la hamaca.', '{descansar}'],
    ['Yo examino el documento.', '{examinar}'],
    ['Ellos disfrutan de las vacaciones.', '{disfrutar}'],
    ['Nosotros efectuamos el pago.', '{efectuar}'],
    ['Tú elaboras el informe.', '{elaborar}'],
    ['Ella evita el conflicto.', '{evitar}'],
    ['Yo gestiono los recursos.', '{gestionar}'],
    ['Ellos innovan en tecnología.', '{innovar}'],
    ['Tú identificas el problema.', '{identificar}'],
    ['Nosotros interpretamos la música.', '{interpretar}'],
    ['Ella mejora su rendimiento.', '{mejorar}'],
    ['Yo muestro la dirección.', '{mostrar}'],
    ['Ellos negocian el contrato.', '{negociar}'],
    ['Tú observas el comportamiento.', '{observar}'],
    ['Ella practica yoga.', '{practicar}'],
    ['Yo percibo un aroma.', '{percibir}'],
    ['Ellos prometen llegar temprano.', '{prometer}'],
    ['Nosotros participamos en el concurso.', '{participar}'],
    ['Tú procuras hacerlo bien.', '{procurar}'],
    ['Ella programa el viaje.', '{programar}'],
    ['Yo realizo el proyecto.', '{realizar}'],
    ['Ellos restringen el acceso.', '{restringir}'],
    ['Nosotros solicitamos ayuda.', '{solicitar}'],
    ['Tú simulas interés.', '{simular}'],
    ['Ella transforma el espacio.', '{transformar}'],
    ['Yo verifico la información.', '{verificar}'],
    ['Ellos viajan a Europa.', '{viajar}'],
    ['Tú validas el ticket.', '{validar}'],
    ['Ella adapta el contenido.', '{adaptar}'],
    ['Yo comparo precios.', '{comparar}'],
    ['Ellos contrastan opiniones.', '{contrastar}'],
    ['Nosotros colaboramos juntos.', '{colaborar}'],
    ['Tú comunicas las novedades.', '{comunicar}'],
    ['Ella dedica tiempo a la lectura.', '{dedicar}'],
    ['Yo exploro la selva.', '{explorar}'],
    ['Ellos garantizan calidad.', '{garantizar}'],
    ['Tú generas ideas.', '{generar}'],
    ['Nosotros incorporamos cambios.', '{incorporar}'],
    ['Ella lanza un producto.', '{lanzar}'],
    ['Yo manipulo el dispositivo.', '{manipular}'],
    ['Ellos motivan al equipo.', '{motivar}'],
    ['Tú navegas por internet.', '{navegar}'],
    ['Ella orienta a los estudiantes.', '{orientar}'],
    ['Yo persisto en mi esfuerzo.', '{persistir}'],
    ['Ellos prevén el futuro.', '{prever}'],
    ['Nosotros procesamos datos.', '{procesar}'],
    ['Tú propones una solución.', '{proponer}'],
    ['Ella reacciona rápidamente.', '{reaccionar}'],
    ['Yo reformo la casa.', '{reformar}'],
    ['Ellos regulan el tráfico.', '{regular}'],
    ['Tú relacionas conceptos.', '{relacionar}'],
    ['Ella representa al grupo.', '{representar}'],
    ['Yo resisto la presión.', '{resistir}'],
    ['Ellos retiran fondos.', '{retirar}'],
    ['Nosotros revisamos el texto.', '{revisar}'],
    ['Tú seleccionas el canal.', '{seleccionar}'],
    ['Ella sitúa el objeto.', '{situar}'],
    ['Yo sumo las cifras.', '{sumar}'],
    ['Ellos suprimen el ruido.', '{suprimir}'],
    ['Tú transmites el mensaje.', '{transmitir}'],
    ['Ella utiliza herramientas.', '{utilizar}'],
    ['Yo varío mi rutina.', '{variar}'],
    ['Ellos visualizan el éxito.', '{visualizar}'],
    ['Tú activas el modo.', '{activar}'],
    ['Ella adapta el guion.', '{adaptar}'],
    ['Yo amplío la información.', '{ampliar}'],
    ['Ellos aportan ideas.', '{aportar}'],
    ['Nosotros asignamos tareas.', '{asignar}']
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str).compute('root')
    let tags = doc.json()[0].terms.map((term) => term.tags[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    t.equal(doc.has(match), true, here + msg)
  })
  t.end()
})
