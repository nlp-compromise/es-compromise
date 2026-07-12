// spanish attaches object/reflexive pronouns to the end of infinitives,
// gerunds and affirmative imperatives - 'quemarme', 'diciéndoselo', 'dámelo'.
// attaching them usually adds a written accent to preserve stress,
// so we de-accent the stem before checking it.

// indirect-object clitics can stack before a direct-object one - 'me lo'
const indirect = ['me', 'te', 'se', 'nos', 'os', 'le', 'les']
const direct = ['lo', 'los', 'la', 'las', 'le', 'les']
let endings = []
indirect.forEach(a => {
  direct.forEach(b => {
    endings.push(a + b)
  })
})
endings = endings.concat(indirect, direct)
// longest-first, so 'melo' is tried before 'lo'
endings.sort((a, b) => b.length - a.length)

const accents = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' }
const deAccent = (str) => str.replace(/[áéíóú]/g, (c) => accents[c])

const isGerund = /(ando|iendo|yendo)$/
const isInfinitive = /(ar|er|ir)$/

const verbish = ['Imperative', 'PresentTense', 'Infinitive', 'Verb', 'Copula', 'Subjunctive']
const isVerb = function (entry) {
  if (!entry) {
    return false
  }
  let tags = typeof entry === 'string' ? [entry] : entry
  return tags.some(t => verbish.includes(t))
}

const tryStem = function (stem, ending, lexicon) {
  let plain = deAccent(stem)
  // 'levantándose', 'diciéndomelo'
  if (isGerund.test(plain)) {
    return { tags: ['Gerund'], stem: plain }
  }
  // 'quemarme', 'mezclarlo' - verify against the lexicon,
  // or accept a long-enough infinitive shape ('bloguearlo')
  if (isInfinitive.test(plain)) {
    if (isVerb(lexicon[plain]) || plain.length >= 5) {
      return { tags: ['Infinitive'], stem: plain }
    }
    return null
  }
  // affirmative imperative - 'dámelo' → 'da', 'hazme' → 'haz'
  if (isVerb(lexicon[plain])) {
    return { tags: ['Imperative', 'SecondPerson'], stem: plain }
  }
  // 'vámonos' → 'vamos' (the final -s is dropped before 'nos')
  if (ending.startsWith('nos') && isVerb(lexicon[plain + 's'])) {
    return { tags: ['Imperative', 'FirstPersonPlural'], stem: plain + 's' }
  }
  return null
}

const checkEnclitic = function (terms, i, world) {
  const setTag = world.methods.one.setTag
  const lexicon = world.model.one.lexicon
  let term = terms[i]
  if (term.tags.size > 0) {
    return null
  }
  let str = term.machine || term.normal
  for (let k = 0; k < endings.length; k += 1) {
    let e = endings[k]
    if (str.length - e.length >= 2 && str.endsWith(e)) {
      let stem = str.slice(0, str.length - e.length)
      let found = tryStem(stem, e, lexicon)
      if (found !== null) {
        // let the root-computation see through the clitics
        term.machine = found.stem
        setTag([term], found.tags, world, false, '2-enclitic')
        term.confidence = 0.8
        return true
      }
    }
  }
  return null
}
export default checkEnclitic
