/* eslint-disable no-console */
import fs from 'fs'
import { pack } from 'efrt'
import { learn, compress } from 'suffix-thumb'
import lexicon from '../data/lexicon/index.js'
import models from '../data/models/index.js'
// import switches from '../lib/switches/index.js'
// import senses from '../lib/senses/index.js'

const steps = [
  {
    label: 'lexicon',
    path: './src/01-one/lexicon/_data.js',
    compress: function () {
      let packed = {}
      //turn them into a series of flat-arrays
      Object.keys(lexicon).forEach(word => {
        let tags = lexicon[word]
        if (typeof tags === 'string') {
          tags = [tags]
        }
        tags.forEach(tag => {
          packed[tag] = packed[tag] || []
          packed[tag].push(word)
        })
      })
      //pack each array into a tiny string
      Object.keys(packed).forEach(tag => {
        packed[tag] = pack(packed[tag])
      })
      return packed
    },
  },
  {
    label: 'models',
    path: './src/01-one/lexicon/methods/_data.js',
    compress: function () {
      let packed = {}
      console.log('plurals')
      let plurals = learn(models.plurals)
      plurals = compress(plurals)
      packed.nouns = {
        plurals
      }
      console.log('adjectives')
      packed.adjectives = {
        f: [],
        mp: [],
        fp: [],
      }
      models.adjectives.forEach(a => {
        packed.adjectives.f.push([a[0], a[1]])
        packed.adjectives.mp.push([a[0], a[2]])
        packed.adjectives.fp.push([a[0], a[3]])
      })
      Object.keys(packed.adjectives).forEach(k => {
        packed.adjectives[k] = compress(learn(packed.adjectives[k]))
      })
      console.log('verbs')
      Object.keys(models.verbs).forEach(k => {
        packed[k] = {}
        Object.keys(models.verbs[k]).forEach(form => {
          let pairs = models.verbs[k][form]
          console.log('-', k, form)
          packed[k][form] = learn(pairs)
          packed[k][form] = compress(packed[k][form])
        })
      })
      console.log('gerunds')
      let gerunds = learn(models.gerunds)
      gerunds = compress(gerunds)
      packed.gerunds = {
        gerunds
      }
      return packed
    },
  }
]

// run through all our steps
steps.forEach(obj => {
  console.log(`\n 🕑  - packing ${obj.label}..`)
  const packed = obj.compress()

  //write it to a file in ./src
  const banner = `// generated in ./lib/${obj.label}\n`
  fs.writeFileSync(obj.path, banner + 'export default ' + JSON.stringify(packed, null, 2), 'utf8')

  //get filesize
  const stats = fs.statSync(obj.path)
  let size = (stats.size / 1000.0).toFixed(1)
  console.log(`       - ${obj.label} is  ` + size + 'k\n')
})
