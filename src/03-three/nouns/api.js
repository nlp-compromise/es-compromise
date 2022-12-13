export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

// get root form of adjective
const getRoot = function (m) {
  let str = m.text('normal')
  let isPlural = m.has('Plural')
  if (isPlural) {
    const transform = this.methods.two.transform
    return transform.adjective.toSingular(str)
  }
  return str
}


const api = function (View) {
  class Nouns extends View {
    constructor(document, pointer, groups) {
      super(document, pointer, groups)
      this.viewType = 'Nouns'
    }
    conjugate(n) {
      const methods = this.methods.two.transform.noun
      return getNth(this, n).map(m => {
        let str = m.text()
        if (m.has('#PluralNoun')) {
          return {
            plural: str,
            singular: methods.toSingular(str)
          }
        }
        return {
          singular: str,
          plural: methods.toPlural(str)
        }
      }, [])
    }
    isPlural(n) {
      return getNth(this, n).if('#PluralNoun')
    }
    toPlural(n) {
      const methods = this.methods.two.transform.noun
      getNth(this, n).if('#Singular').forEach(m => {
        let str = getRoot(m)
        let plural = methods.toPlural(str)
        return m.replaceWith(plural)
      })
      return this
    }
    toSingular(n) {
      const methods = this.methods.two.transform.noun
      getNth(this, n).if('#Plural').forEach(m => {
        let str = getRoot(m)
        let singular = methods.toSingular(str)
        m.replaceWith(singular)
        // flip article, too
        let art = m.before('(los|las|unos|unas|mis|tus|nuestro|nuestra|vuestro|vuestra)$')
        if (art.found) {
          let toPlur = {
            los: 'el',
            las: 'la',
            unos: 'un',
            unas: 'una',
            mis: 'mi',
            tus: 'tu',
            // sus:'su',
            nuestro: 'nuestros',
            nuestra: 'nuestras',
            vuestro: 'vuestros',
            vuestra: 'vuestras',
          }
          let w = art.text('normal')
          if (toPlur.hasOwnProperty(w)) {
            art.replaceWith(toPlur[w])
          }
        }
      })
      return this
    }
  }

  View.prototype.nouns = function (n) {
    let m = this.match('#Noun')
    m = getNth(m, n)
    return new Nouns(this.document, m.pointer)
  }
}
export default api