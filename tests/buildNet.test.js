import test from 'tape'
import nlp from './_lib.js'
const here = '[es-buildNet] '

test('buildNet:', function (t) {
  const matches = [
    { match: '{odiar/Verb}' },
    { match: '{armonioso/Adjective}' },
    { match: '{peligro/Noun}' }
  ]
  const net = nlp.buildNet(matches)
  t.ok(net.hooks.odiar, here + 'odiar')
  t.ok(net.hooks.odiamos, here + 'odiamos')
  t.ok(net.hooks.armonioso, here + 'armonioso')
  t.ok(net.hooks.armoniosos, here + 'armoniosos')
  t.ok(net.hooks.peligro, here + 'peligro')
  t.ok(net.hooks.peligros, here + 'peligros')

  t.end()
})