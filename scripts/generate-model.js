import { learn, compress } from 'suffix-thumb'
import data from '../data/models/adjectives.js'

let out = {}
let pairs = data.map(a => [a[0], a[1]])
let model = learn(pairs)
model = compress(model)
out.toFem = model

pairs = data.map(a => [a[0], a[2]])
model = learn(pairs)
model = compress(model)
out.toPlural = model

pairs = data.map(a => [a[0], a[3]])
model = learn(pairs)
model = compress(model)
out.toFemPlural = model


console.log(out)