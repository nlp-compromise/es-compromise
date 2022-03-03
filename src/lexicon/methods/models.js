import { convert, uncompress } from 'suffix-thumb'
import model from './_data.js'

// uncompress them
Object.keys(model).forEach(k => {
  Object.keys(model[k]).forEach(form => {
    model[k][form] = uncompress(model[k][form])
  })
})

const doVerb = function (str, m) {
  return {
    first: convert(str, m.first),
    second: convert(str, m.second),
    third: convert(str, m.third),
    firstPlural: convert(str, m.firstPlural),
    secondPlural: convert(str, m.secondPlural),
    thirdPlural: convert(str, m.thirdPlural),
  }
}

const presentTense = (str) => doVerb(str, model.presentTense)
const pastTense = (str) => doVerb(str, model.pastTense)
// const futureTense = (str) => doVerb(str, model.futureTense)
// const conditional = (str) => doVerb(str, model.conditional)


export default { presentTense, pastTense }//futureTense, conditional
