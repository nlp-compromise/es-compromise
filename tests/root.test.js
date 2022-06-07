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
    [`Cualquiera puede decir cosas encantadoras y tratar de`, '{encantar}'],
    [`Las 10 principales conversiones patrimoniales en Toronto`, '{conversión}'],
    [`la compañía se dispersó`, '{dispersarse}'],
    [`una apelación oportuna.`, '{oportuno}'],
    [`Estamos viendo algunas señales alentadoras.`, '{alentador}'],
    [`Profundo en esa oscuridad mirando`, '{mirar}'],
    [`Determina si has estado abusando del alcohol`, '{abusar}'],
    // [`republicanos que simplifiquen el sistema`, '{simplificar}'],
    [`Voy a usar el cojín.`, '{cojín}'],
    [`Los cojines son la esencia`, '{cojín}'],
    [`Alguien me dijo que soy condescendiente.`, '{condescender}'],
    [`Uno asesinado; 6 heridos en disputa familiar`, '{disputar}'],
    [`Las líneas de preocupación aparecieron con la edad.`, '{preocupación}'],
    [`AGO Massive Party un espectáculo extraño y maravilloso`, '{espectáculo}'],
    // [`Las papas fritas estaban empapadas`, '{empapado}'],
    [`AGO Massive Party un espectáculo extraño y maravilloso`, '{espectáculo}'],
    [`las reclamaciones restantes fallan porque no están maduras.`, '{madura}'],

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
