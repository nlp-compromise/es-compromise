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
    ['Nosotros asignamos tareas.', '{asignar}'],
    ['Ellos hablan con sus vecinos.', '{hablar}'], // present-tense
    // ['Si pudieras volar, ¿lo harías?', '{poder}'], // conditional
    ['No hables tan alto.', '{hablar}'], // imperative
    ['Es probable que él venga mañana.', '{venir}'], // subjunctive
    ['Yo había comido antes de que llegaras.', '{comer}'], // past perfect

    ['Ella canta en el coro.', '{cantar}'], // present-tense
    // ['Si él tuviera dinero, viajaría.', '{tener}'], // conditional
    ['¡Corre más rápido!', '{correr}'], // imperative
    ['Es posible que lloviera mañana.', '{llover}'], // subjunctive
    ['Habíamos llegado antes de que empezara el show.', '{llegar}'], // past perfect
    ['Vivirás una gran aventura.', '{vivir}'], // simple future
    ['Yo trabajaba cuando me llamaste.', '{trabajar}'], // imperfect
    ['Estudiaron para el examen.', '{estudiar}'], // preterite
    ['Ojalá no llueva durante el picnic.', '{llover}'], // subjunctive
    ['Hazme un favor.', '{hacer}'], // imperative
    ['Ella está escribiendo una carta.', '{escribir}'], // present continuous
    ['Si supieses la verdad, ¿qué harías?', '{saber}'], // conditional
    ['Estábamos comiendo cuando llegó.', '{comer}'], // imperfect continuous
    ['Habrán terminado para las tres.', '{terminar}'], // future perfect
    ['Espero que tengas un buen día.', '{tener}'], // subjunctive
    ['Dame el libro.', '{dar}'], // imperative
    ['Vivíamos en esa casa hace años.', '{vivir}'], // imperfect
    ['Ella había leído el libro antes.', '{leer}'], // past perfect
    ['Quizás él venga a la fiesta.', '{venir}'], // subjunctive
    ['Sal de aquí.', '{salir}'], // imperative
    ['Él está construyendo un castillo de arena.', '{construir}'], // present continuous
    ['Si tuviera un perro, lo llamaría Max.', '{llamar}'], // conditional
    ['Estudié toda la noche.', '{estudiar}'], // preterite
    ['Me alegra que lo disfrutes.', '{disfrutar}'], // subjunctive
    ['Trae más comida.', '{traer}'], // imperative
    ['Él estaba cantando en el baño.', '{cantar}'], // imperfect continuous
    ['Tendré que salir temprano mañana.', '{tener}'], // simple future
    ['Jugaba al fútbol con mis amigos.', '{jugar}'], // imperfect
    ['Ellos habían viajado a Francia antes.', '{viajar}'], // past perfect
    ['Es probable que María venga al concierto.', '{venir}'], // subjunctive
    ['Pon la mesa.', '{poner}'], // imperative
    ['Yo estaba corriendo en el parque.', '{correr}'], // imperfect continuous
    ['Ella tendrá un nuevo empleo.', '{tener}'], // simple future
    ['Nosotros compramos un coche nuevo.', '{comprar}'], // preterite
    ['Es bueno que estudies.', '{estudiar}'], // subjunctive
    ['Sé amable.', '{ser}'], // imperative
    ['Ella estaba escuchando música.', '{escuchar}'], // imperfect continuous
    ['Habré terminado antes de que vuelvas.', '{terminar}'], // future perfect
    ['Nosotros íbamos a la escuela juntos.', '{ir}'], // imperfect
    ['Me gustaría que vinieras a mi fiesta.', '{venir}'], // subjunctive
    ['Escribe tu nombre.', '{escribir}'], // imperative
    ['Ella está leyendo un libro interesante.', '{leer}'], // present continuous
    // ['Si pudiese volar, sería un pájaro.', '{poder}'], // conditional
    ['Ella comió pizza ayer.', '{comer}'], // preterite
    ['Ojalá él sepa la respuesta.', '{saber}'], // subjunctive
    ['Habla más claro.', '{hablar}'], // imperative
    ['Ellos estaban bailando en la fiesta.', '{bailar}'], // imperfect continuous
    ['Habréis visto la película para entonces.', '{ver}'], // future perfect
    ['Cuando era niño, vivía en el campo.', '{vivir}'], // imperfect
    ['Me sorprende que no lo sepas.', '{saber}'], // subjunctive
    ['Vive el momento.', '{vivir}'], // imperative
    ['Ella estaba mirando la televisión.', '{mirar}'], // imperfect continuous
    ['Él traerá las bebidas mañana.', '{traer}'], // simple future
    ['Ellos dieron un regalo a su madre.', '{dar}'], // preterite
    ['Es importante que lo comprendas.', '{comprender}'], // subjunctive
    ['No comas eso.', '{comer}'], // imperative
    ['Estábamos esperando el autobús.', '{esperar}'], // imperfect continuous
    ['Ella tendrá un bebé.', '{tener}'], // simple future
    ['El año pasado, viajé a España.', '{viajar}'], // preterite
    ['Es posible que no lo haga.', '{hacer}'], // subjunctive
    ['Camina con cuidado.', '{caminar}'], // imperative
    ['Él estaba escribiendo un poema.', '{escribir}'], // imperfect continuous
    ['Habrán llegado cuando tú regreses.', '{llegar}'], // future perfect
    // ['Cuando era joven, leía mucho.', '{leer}'], // imperfect
    ['Quisiera que me ayudaras.', '{ayudar}'], // subjunctive
    ['Abre la puerta.', '{abrir}'], // imperative
    ['Ella está bailando salsa.', '{bailar}'], // present continuous
    ['Si pudiese, viajaría por el mundo.', '{viajar}'], // conditional
    ['Ella visitó a sus abuelos.', '{visitar}'], // preterite
    ['Ojalá llueva mañana.', '{llover}'], // subjunctive
    ['Escucha atentamente.', '{escuchar}'], // imperative
    ['Estaban comiendo en el restaurante.', '{comer}'], // imperfect continuous
    ['Tendrán una nueva casa.', '{tener}'], // simple future
    ['Antes jugábamos juntos todos los días.', '{jugar}'], // imperfect
    ['Dudo que él sepa la dirección.', '{saber}'], // subjunctive
    ['No digas eso.', '{decir}'], // imperative
    ['Ella estaba tomando fotos.', '{tomar}'], // imperfect continuous
    ['Tendré una reunión más tarde.', '{tener}'], // simple future
    ['Ella trabajó en esa empresa por 10 años.', '{trabajar}'], // preterite
    ['Espero que lo disfruten.', '{disfrutar}'], // subjunctive
    ['No fumes aquí.', '{fumar}'], // imperative
    ['Yo estaba pensando en ti.', '{pensar}'], // imperfect continuous
    ['Ella hará una torta para el cumpleaños.', '{hacer}'], // simple future

    ['Nosotros nadamos en el lago.', '{nadar}'], // present-tense
    ['Si fueras más rápido, ganarías.', '{ser}'], // conditional
    ['No mires atrás.', '{mirar}'], // imperative
    ['Espero que llegue pronto.', '{llegar}'], // subjunctive
    ['Ellos habían ido al mercado.', '{ir}'], // past perfect
    ['Aprenderás de tus errores.', '{aprender}'], // simple future
    // ['Cuando era pequeño, temía a la oscuridad.', '{temer}'], // imperfect
    ['Ella vendió su coche.', '{vender}'], // preterite
    ['Ojalá no trabajes mañana.', '{trabajar}'], // subjunctive
    ['Hazlo bien.', '{hacer}'], // imperative
    ['Él está nadando en la piscina.', '{nadar}'], // present continuous
    // ['Si tuvieras más tiempo, ¿qué harías?', '{tener}'], // conditional
    ['Ella estaba jugando al tenis.', '{jugar}'], // imperfect continuous
    ['Habrán acabado antes de las diez.', '{acabar}'], // future perfect
    // ['Espero que pueda ayudarte.', '{poder}'], // subjunctive
    ['Toma un descanso.', '{tomar}'], // imperative
    ['Ellos se encontraban en la plaza.', '{encontrar}'], // imperfect
    ['Habíamos decidido no ir.', '{decidir}'], // past perfect
    ['Deseo que seas feliz.', '{ser}'], // subjunctive
    ['Sigue adelante.', '{seguir}'], // imperative
    ['Ella está preparando el desayuno.', '{preparar}'], // present continuous
    // ['Si pudieras leer mentes, ¿lo harías?', '{poder}'], // conditional
    ['Nosotros bailábamos toda la noche.', '{bailar}'], // imperfect
    ['Me alegra que lo intentes.', '{intentar}'], // subjunctive
    ['Responde la pregunta.', '{responder}'], // imperative
    ['Él estaba estudiando matemáticas.', '{estudiar}'], // imperfect continuous
    ['Amarás este libro.', '{amar}'], // simple future
    ['El año pasado, fui a Italia.', '{ir}'], // preterite
    ['Ojalá él entienda.', '{entender}'], // subjunctive
    ['Siéntate aquí.', '{sentar}'], // imperative
    ['Ellos estaban escuchando música clásica.', '{escuchar}'], // imperfect continuous
    ['Ella comprará un vestido nuevo.', '{comprar}'], // simple future
    ['Ellos visitaron la catedral.', '{visitar}'], // preterite
    ['Es triste que no vengas.', '{venir}'], // subjunctive
    ['Lee el manual.', '{leer}'], // imperative
    ['Estábamos corriendo por el parque.', '{correr}'], // imperfect continuous
    ['Él construirá una casa.', '{construir}'], // simple future
    ['Ella pintó ese cuadro.', '{pintar}'], // preterite
    ['Deseo que no llueva mañana.', '{llover}'], // subjunctive
    ['Vive como si fuera el último día.', '{vivir}'], // imperative
    ['Nosotros estábamos cocinando juntos.', '{cocinar}'], // imperfect continuous
    ['Ellos recibirán un premio.', '{recibir}'], // simple future
    ['Ella aprendió francés en la escuela.', '{aprender}'], // preterite
    ['Ojalá lo encuentres.', '{encontrar}'], // subjunctive
    ['Di la verdad.', '{decir}'], // imperative
    ['Ellos estaban caminando por el bosque.', '{caminar}'], // imperfect continuous
    ['Ellos regresarán a casa pronto.', '{regresar}'], // simple future
    ['Cuando era niña, jugaba con muñecas.', '{jugar}'], // imperfect
    // ['Ojalá tú puedas venir.', '{poder}'], // subjunctive
    ['Ríe a menudo.', '{reír}'], // imperative
    ['Ellos estaban mirando el atardecer.', '{mirar}'], // imperfect continuous
    ['Ella cantará en el concierto.', '{cantar}'], // simple future
    ['Nosotros almorzamos juntos ayer.', '{almorzar}'], // preterite
    ['Dudo que él llegue a tiempo.', '{llegar}'], // subjunctive
    ['No entres sin llamar.', '{entrar}'], // imperative
    ['Estábamos leyendo en silencio.', '{leer}'], // imperfect continuous
    ['Ella creará una obra maestra.', '{crear}'], // simple future
    ['Nosotros viajamos a Europa el año pasado.', '{viajar}'], // preterite
    ['Espero que lo hagan bien.', '{hacer}'], // subjunctive
    ['No bebas demasiado.', '{beber}'], // imperative
    ['Ella estaba pensando en el futuro.', '{pensar}'], // imperfect continuous
    ['Ella escribirá un libro.', '{escribir}'], // simple future
    ['Ella tomó café esta mañana.', '{tomar}'], // preterite
    ['Deseo que te quedes.', '{quedar}'] // subjunctive
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
