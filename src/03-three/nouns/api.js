export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

const toPluralArt = {
  el: 'los',
  la: 'las',
  un: 'unos',
  una: 'unas',
  mi: 'mis',
  tu: 'tus',
  nuestro: 'nuestros',
  nuestra: 'nuestras',
  vuestro: 'vuestros',
  vuestra: 'vuestras',
}
const toSingularArt = {
  los: 'el',
  las: 'la',
  unos: 'un',
  unas: 'una',
  mis: 'mi',
  tus: 'tu',
  nuestros: 'nuestro',
  nuestras: 'nuestra',
  vuestros: 'vuestro',
  vuestras: 'vuestra',
}

// flip 'los' → 'el', etc
const swapArticle = function (m, mapping) {
  let art = m.before(`(${Object.keys(mapping).join('|')})$`)
  if (art.found) {
    let w = art.text('normal')
    if (mapping.hasOwnProperty(w)) {
      art.replaceWith(mapping[w])
    }
  }
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
      getNth(this, n).ifNo('#Plural').forEach(m => {
        let str = m.text('normal')
        let plural = methods.toPlural(str)
        m.replaceWith(plural)
        // flip article, too
        swapArticle(m, toPluralArt)
      })
      return this
    }
    toSingular(n) {
      const methods = this.methods.two.transform.noun
      getNth(this, n).if('#Plural').forEach(m => {
        let str = m.text('normal')
        let singular = methods.toSingular(str)
        m.replaceWith(singular)
        // flip article, too
        swapArticle(m, toSingularArt)
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