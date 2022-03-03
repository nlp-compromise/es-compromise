
import infinitives from './verbs/infinitives.js'

import femaleNames from './people/femaleNames.js'
import maleNames from './people/maleNames.js'
import firstNames from './people/firstNames.js'
import lastNames from './people/lastNames.js'
import people from './people/people.js'



const data = [


  [infinitives, 'Infinitive'],

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
    // log duplicates
    // if (lex[list[o]]) {
    //   console.log(list[o] + '  ' + lex[list[o]] + ' ' + data[i][1])
    // }
    lex[list[o]] = data[i][1]
  }
}
// console.log(lex)
export default lex
