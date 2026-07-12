import conjunctions from './conjunctions.js'
import determiners from './determiners.js'
import prepositions from './prepositions.js'
import adverbs from './adverbs.js'
import adjectives from './adjectives.js'

import pronouns from './nouns/pronouns.js'
import nouns from './nouns/nouns.js'

import infinitives from './verbs/infinitives.js'
import auxiliaries from './verbs/auxiliaries.js'
import modals from './verbs/modals.js'
import copulas from './verbs/copula.js'

import months from './dates/months.js'
import weekdays from './dates/weekdays.js'

import cardinals from './numbers/cardinals.js'
import ordinals from './numbers/ordinals.js'
import units from './numbers/units.js'

// people
import femaleNames from './people/femaleNames.js'
import maleNames from './people/maleNames.js'
import firstNames from './people/firstNames.js'
import lastNames from './people/lastNames.js'
import people from './people/people.js'

// places
import cities from './places/cities.js'
import countries from './places/countries.js'
import places from './places/places.js'
import regions from './places/regions.js'


// listed in priority-order - the first list to claim a word wins.
// closed-class function words go first, so noisy corpus-learned
// lists (nouns, adjectives, names) can never overwrite them.
const data = [

  [conjunctions, 'Conjunction'],
  [determiners, 'Determiner'],
  [prepositions, 'Preposition'],
  [pronouns, 'Pronoun'],
  [adverbs, 'Adverb'],

  [ordinals, 'Ordinal'],
  [cardinals, 'Cardinal'],
  [units, 'Unit'],

  [months, 'Month'],
  [weekdays, 'WeekDay'],

  [copulas, 'Copula'],
  [auxiliaries, 'Auxiliary'],
  [modals, 'Modal'],
  [infinitives, 'Infinitive'],

  [nouns, 'Noun'],
  [adjectives, 'Adjective'],

  [cities, 'City'],
  [countries, 'Country'],
  [places, 'Place'],
  [regions, 'Region'],

  [femaleNames, 'FemaleName'],
  [maleNames, 'MaleName'],
  [firstNames, 'FirstName'],
  [lastNames, 'LastName'],
  [people, 'Person'],

]

let lex = {}
for (let i = 0; i < data.length; i++) {
  const list = data[i][0]
  for (let o = 0; o < list.length; o++) {
    // first-wins - do not let a lower-priority list overwrite
    if (lex[list[o]] !== undefined) {
      continue
    }
    lex[list[o]] = data[i][1]
  }
}
// console.log(lex)
export default lex
