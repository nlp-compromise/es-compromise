import model from './verb/present-tense.js'

Object.keys(model).forEach((k) => {
  const s = new Set()
  model[k].forEach((str, i) => {
    if (s.has(str) || !str || /[- ']/.test(str)) {
      console.log(k, str) // eslint-disable-line no-console
    }
    if (i === 2) {
      s.add(str)
    }
  })
})
