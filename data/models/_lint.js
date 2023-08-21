import model from './verb/present-tense.js'

Object.keys(model).forEach((k) => {
  let s = new Set()
  model[k].forEach((str, i) => {
    if (s.has(str) || !str || str.match(/[- ']/)) {
      console.log(k, str)
    }
    if (i === 2) {
      s.add(str)
    }
  })
})
