import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'
const { presentTense, pastTense, imperfectTense, futureTense, conditional, subjunctive, imperative } = model

// =-=-
const revAll = function (m) {
  return Object.keys(m).reduce((h, k) => {
    h[k] = reverse(m[k])
    return h
  }, {})
}

// suffix-thumb v6 applies its closest rule to any input, so a word the model
// never saw still comes back changed - only accept a root that conjugates
// back into the word we started with
const safe = (str, rev, fwd) => {
  const out = convert(str, rev)
  return convert(out, fwd) === str ? out : str
}

const presentRev = revAll(presentTense)
const pastRev = revAll(pastTense)
const imperfectRev = revAll(imperfectTense)
const futureRev = revAll(futureTense)
const conditionalRev = revAll(conditional)
const subjunctRev = revAll(subjunctive)
const imperativeRev = revAll(imperative)

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
  const forms = {
    'FirstPerson': (s) => safe(s, presentRev.first, presentTense.first),
    'SecondPerson': (s) => safe(s, presentRev.second, presentTense.second),
    'ThirdPerson': (s) => safe(s, presentRev.third, presentTense.third),
    'FirstPersonPlural': (s) => safe(s, presentRev.firstPlural, presentTense.firstPlural),
    'SecondPersonPlural': (s) => safe(s, presentRev.secondPlural, presentTense.secondPlural),
    'ThirdPersonPlural': (s) => safe(s, presentRev.thirdPlural, presentTense.thirdPlural),
  }
  if (forms.hasOwnProperty(form)) {
    return forms[form](str)
  }
  return stripReflexive(str)
}

const fromPast = (str, form) => {
  const forms = {
    'FirstPerson': (s) => safe(s, pastRev.first, pastTense.first),
    'SecondPerson': (s) => safe(s, pastRev.second, pastTense.second),
    'ThirdPerson': (s) => safe(s, pastRev.third, pastTense.third),
    'FirstPersonPlural': (s) => safe(s, pastRev.firstPlural, pastTense.firstPlural),
    'SecondPersonPlural': (s) => safe(s, pastRev.secondPlural, pastTense.secondPlural),
    'ThirdPersonPlural': (s) => safe(s, pastRev.thirdPlural, pastTense.thirdPlural),
  }
  if (forms.hasOwnProperty(form)) {
    return forms[form](str)
  }
  return stripReflexive(str)
}

const fromImperfect = (str, form) => {
  const forms = {
    'FirstPerson': (s) => safe(s, imperfectRev.first, imperfectTense.first),
    'SecondPerson': (s) => safe(s, imperfectRev.second, imperfectTense.second),
    'ThirdPerson': (s) => safe(s, imperfectRev.third, imperfectTense.third),
    'FirstPersonPlural': (s) => safe(s, imperfectRev.firstPlural, imperfectTense.firstPlural),
    'SecondPersonPlural': (s) => safe(s, imperfectRev.secondPlural, imperfectTense.secondPlural),
    'ThirdPersonPlural': (s) => safe(s, imperfectRev.thirdPlural, imperfectTense.thirdPlural),
  }
  if (forms.hasOwnProperty(form)) {
    return forms[form](str)
  }
  // person-ambiguous forms ('hablaba' is 1st or 3rd) - try third-person
  return safe(str, imperfectRev.third, imperfectTense.third)
}

const fromFuture = (str, form) => {
  const forms = {
    'FirstPerson': (s) => safe(s, futureRev.first, futureTense.first),
    'SecondPerson': (s) => safe(s, futureRev.second, futureTense.second),
    'ThirdPerson': (s) => safe(s, futureRev.third, futureTense.third),
    'FirstPersonPlural': (s) => safe(s, futureRev.firstPlural, futureTense.firstPlural),
    'SecondPersonPlural': (s) => safe(s, futureRev.secondPlural, futureTense.secondPlural),
    'ThirdPersonPlural': (s) => safe(s, futureRev.thirdPlural, futureTense.thirdPlural),
  }
  if (forms.hasOwnProperty(form)) {
    return forms[form](str)
  }
  return stripReflexive(str)
}

const fromConditional = (str, form) => {
  const forms = {
    'FirstPerson': (s) => safe(s, conditionalRev.first, conditional.first),
    'SecondPerson': (s) => safe(s, conditionalRev.second, conditional.second),
    'ThirdPerson': (s) => safe(s, conditionalRev.third, conditional.third),
    'FirstPersonPlural': (s) => safe(s, conditionalRev.firstPlural, conditional.firstPlural),
    'SecondPersonPlural': (s) => safe(s, conditionalRev.secondPlural, conditional.secondPlural),
    'ThirdPersonPlural': (s) => safe(s, conditionalRev.thirdPlural, conditional.thirdPlural),
  }
  if (forms.hasOwnProperty(form)) {
    return forms[form](str)
  }
  return stripReflexive(str)
}

const fromSubjunctive = (str, form) => {
  const forms = {
    'FirstPerson': (s) => safe(s, subjunctRev.first, subjunctive.first),
    'SecondPerson': (s) => safe(s, subjunctRev.second, subjunctive.second),
    'ThirdPerson': (s) => safe(s, subjunctRev.third, subjunctive.third),
    'FirstPersonPlural': (s) => safe(s, subjunctRev.firstPlural, subjunctive.firstPlural),
    'SecondPersonPlural': (s) => safe(s, subjunctRev.secondPlural, subjunctive.secondPlural),
    'ThirdPersonPlural': (s) => safe(s, subjunctRev.thirdPlural, subjunctive.thirdPlural),
  }
  if (forms.hasOwnProperty(form)) {
    return forms[form](str)
  }
  return str
}

const fromImperative = (str, form) => {
  const forms = {
    'FirstPerson': (s) => safe(s, imperativeRev.first, imperative.first),
    'SecondPerson': (s) => safe(s, imperativeRev.second, imperative.second),
    'ThirdPerson': (s) => safe(s, imperativeRev.third, imperative.third),
    'FirstPersonPlural': (s) => safe(s, imperativeRev.firstPlural, imperative.firstPlural),
    'SecondPersonPlural': (s) => safe(s, imperativeRev.secondPlural, imperative.secondPlural),
    'ThirdPersonPlural': (s) => safe(s, imperativeRev.thirdPlural, imperative.thirdPlural),
  }
  if (forms.hasOwnProperty(form)) {
    return forms[form](str)
  }
  return str
}


export {
  fromPresent,
  fromPast,
  fromImperfect,
  fromFuture,
  fromConditional,
  fromSubjunctive,
  fromImperative,
}