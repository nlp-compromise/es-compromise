import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'
let { presentTense, pastTense, futureTense, conditional } = model

// =-=-
const revAll = function (m) {
  return Object.keys(m).reduce((h, k) => {
    h[k] = reverse(m[k])
    return h
  }, {})
}

let presentRev = revAll(presentTense)
let pastRev = revAll(pastTense)
let futureRev = revAll(futureTense)
let conditionalRev = revAll(conditional)

//relajarse -> relajar
const stripReflexive = function (str) {
  str = str.replace(/arse$/, 'ar')
  str = str.replace(/arte$/, 'ir')
  str = str.replace(/arme$/, 'ar')

  str = str.replace(/irse$/, 'ir')
  str = str.replace(/irte$/, 'ir')

  str = str.replace(/erse$/, 'er')
  str = str.replace(/ose$/, 'o')
  return str
}

const fromPresent = (str, form) => {
  let forms = {
    'FirstPerson': (s) => convert(s, presentRev.first),
    'SecondPerson': (s) => convert(s, presentRev.second),
    'ThirdPerson': (s) => convert(s, presentRev.third),
    'FirstPersonPlural': (s) => convert(s, presentRev.firstPlural),
    'SecondPersonPlural': (s) => convert(s, presentRev.secondPlural),
    'ThirdPersonPlural': (s) => convert(s, presentRev.thirdPlural),
  }
  if (forms.hasOwnProperty(form)) {
    return forms[form](str)
  }
  return stripReflexive(str)
}

const fromPast = (str, form) => {
  let forms = {
    'FirstPerson': (s) => convert(s, pastRev.first),
    'SecondPerson': (s) => convert(s, pastRev.second),
    'ThirdPerson': (s) => convert(s, pastRev.third),
    'FirstPersonPlural': (s) => convert(s, pastRev.firstPlural),
    'SecondPersonPlural': (s) => convert(s, pastRev.secondPlural),
    'ThirdPersonPlural': (s) => convert(s, pastRev.thirdPlural),
  }
  if (forms.hasOwnProperty(form)) {
    return forms[form](str)
  }
  return stripReflexive(str)
}

const fromFuture = (str, form) => {
  let forms = {
    'FirstPerson': (s) => convert(s, futureRev.first),
    'SecondPerson': (s) => convert(s, futureRev.second),
    'ThirdPerson': (s) => convert(s, futureRev.third),
    'FirstPersonPlural': (s) => convert(s, futureRev.firstPlural),
    'SecondPersonPlural': (s) => convert(s, futureRev.secondPlural),
    'ThirdPersonPlural': (s) => convert(s, futureRev.thirdPlural),
  }
  if (forms.hasOwnProperty(form)) {
    return forms[form](str)
  }
  return stripReflexive(str)
}

const fromConditional = (str, form) => {
  let forms = {
    'FirstPerson': (s) => convert(s, conditionalRev.first),
    'SecondPerson': (s) => convert(s, conditionalRev.second),
    'ThirdPerson': (s) => convert(s, conditionalRev.third),
    'FirstPersonPlural': (s) => convert(s, conditionalRev.firstPlural),
    'SecondPersonPlural': (s) => convert(s, conditionalRev.secondPlural),
    'ThirdPersonPlural': (s) => convert(s, conditionalRev.thirdPlural),
  }
  if (forms.hasOwnProperty(form)) {
    return forms[form](str)
  }
  return stripReflexive(str)
}


export {
  fromPresent,
  fromPast,
  fromFuture,
  fromConditional
}