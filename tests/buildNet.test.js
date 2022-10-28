import test from 'tape'
import nlp from './_lib.js'
let here = '[es-buildNet] '

test('buildNet:', function (t) {
  let matches = [
    { match: '{odiar/Verb}' },
    { match: '{armonioso/Adjective}' },
    { match: '{peligro/Noun}' }
  ]
  let net = nlp.buildNet(matches)
  t.ok(net.hooks.odiar, here + 'odiar')
  t.ok(net.hooks.odiamos, here + 'odiamos')
  t.ok(net.hooks.armonioso, here + 'armonioso')
  t.ok(net.hooks.armoniosos, here + 'armoniosos')
  t.ok(net.hooks.peligro, here + 'peligro')
  t.ok(net.hooks.peligros, here + 'peligros')

  t.end()
})