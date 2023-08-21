import prettyJSON from 'pretty-json-stringify'
import already from './data/models/verb/present-tense.js'

import fs from 'fs'
// parse JSON-newline file
let arr = fs
  .readFileSync('./verbs.jsonl')
  .toString()

  .split(/\n/)
  .filter((str) => str)
  .map((str) => JSON.parse(str))

let out = {}
let count = arr.forEach((obj) => {
  if (
    obj.word &&
    obj['Indicativo Presente'] &&
    obj['Indicativo Presente'].length === 6 &&
    !already[obj.word]
  ) {
    out[obj.word] = obj['Indicativo Presente']
  } else {
    // console.log(obj['Indicativo Presente'])
  }
})
console.log(
  prettyJSON(out, {
    shouldExpand: (_, level) => (level >= 1 ? false : true),
  })
)
