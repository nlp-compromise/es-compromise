import prettyJSON from 'pretty-json-stringify'

import fs from 'fs'
// parse JSON-newline file
let arr = fs.readFileSync('./more.jsonl').toString()
  .split(/\n/).filter(str => str).map(str => JSON.parse(str))

let out = {}
arr.forEach(obj => {
  if (obj.word && obj["Indicatif Présent"] && obj["Indicatif Présent"].length === 6) {
    out[obj.word] = obj["Indicatif Présent"]
  }
})
console.log(prettyJSON(out, {
  shouldExpand: (_, level) => level >= 1 ? false : true
}))
