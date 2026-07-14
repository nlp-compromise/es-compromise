// some common exceptions to our rules (limited)
const m = new Set([
  'nombre', 'año', 'tiempo', 'grupo', 'sistema',
  'and', 'sur', 'tipo', 'álbum', 'nivel',
  'origen', 'poder', 'cuerpo', 'hecho',
  'campo', 'papel', 'carácter',
  'tamaño', 'aire', 'problema', 'metal',
  'idioma', 'corazón', 'video', 'pie',
  'latín', 'obispo', 'single', 'príncipe',
  'catalán', 'deseo', 'alemán',
  'filósofo', 'huevo', 'tubo', 'géographique',
  'cráneo', 'reflejo', 'vértice', 'timbre',
  'día', 'mapa', 'planeta', 'sofá', 'clima',
  'tema', 'drama', 'programa', 'poema', 'tranvía',
])

const f = new Set([
  'ciudad', 'parte', 'forma', 'vez', 'serie',
  'the', 'región', 'muerte', 'agua',
  'capital', 'final', 'línea', 'área',
  'orden', 'edad', 'madre', 'mujer',
  'superficie', 'especie', 'luz', 'voz',
  'hija', 'lengua', 'imagen',
  'fecha', 'sede', 'sociedad', 'noche',
  'gente', 'calle', 'ley', 'clase',
  'mano', 'foto', 'moto', 'flor', 'radio',
  'sal', 'piel', 'miel', 'nube', 'sangre',
])
export default { f, m }