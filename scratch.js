import nlp from './src/index.js'

// nlp.verbose('tagger')

let txt = 'Sí, sabes que ya llevo un rato mirándote. Tengo que bailar contigo hoy'
txt = 'el es muy bueno asdfial'
txt = 'Sí, sabes que ya llevo un rato mirándote. Tengo que bailar contigo hoy'
txt = 'comotio'


txt = `Nosotras comimos los zapatos calientes`
txt = `Ellas comen el zapato, nosotras comimos`
txt = `tiramos nuestros zapatos al río`


txt = `Qué irónico`
txt = `Algo irónico`
txt = `no solo fue impactante.` //impactar
txt = `disgustado por circunstancias` //desagradar
txt = `Aprovecha el poder ` //aprovechar
txt = `La incorporación estatutaria siguió` //estatutario
txt = `Está ahí para la exploración espacial` //exploración
txt = `Cualquiera puede decir cosas encantadoras y tratar de` //encantar
txt = `Las 10 principales conversiones patrimoniales en Toronto` //conversión
txt = `la compañía se dispersó` //dispersarse
txt = `una apelación oportuna.` //oportuno
txt = `Estamos viendo algunas señales alentadoras.` //alentador
txt = `Profundo en esa oscuridad mirando` //mirar
txt = `Determina si has estado abusando del alcohol` //abusar
txt = `republicanos que simplifiquen el sistema` //simplificar
txt = `Voy a usar el cojín.`//'cojín'
txt = `Los cojines son la esencia`//'cojín'
txt = `Alguien me dijo que soy condescendiente.`//condescender
txt = `Uno asesinado; 6 heridos en disputa familiar`//'disputar'
txt = `Las líneas de preocupación aparecieron con la edad.`//preocupación'
txt = ` AGO Massive Party un espectáculo extraño y maravilloso`//espectáculo'
txt = ` Las papas fritas estaban empapadas`//empapado'
txt = ` AGO Massive Party un espectáculo extraño y maravilloso`//espectáculo'
txt = ` las reclamaciones restantes fallan porque no están maduras.`//madura'

let doc = nlp('la persona se enoja fácilmente o es verbalmente abusiva.')
doc.numbers().minus(50)
doc.text()
// tengo moins diez dolares
