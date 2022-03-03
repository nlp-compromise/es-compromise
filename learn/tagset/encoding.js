import fs from 'fs';
import detectCharacterEncoding from 'detect-character-encoding';

const fileBuffer = fs.readFileSync(`/Users/spencer/data/tagged.es/spanishEtiquetado_15000_20000`);
const charsetMatch = detectCharacterEncoding(fileBuffer);

console.log(charsetMatch);