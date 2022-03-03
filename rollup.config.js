import { terser } from 'rollup-plugin-terser'
import { nodeResolve } from '@rollup/plugin-node-resolve';

const opts = {
  keep_classnames: true,
  module: true,
}

export default [
  // === Main ==
  {
    input: 'src/index.js',
    output: [{ file: 'builds/es-compromise.cjs', format: 'umd', name: 'esCompromise' }],
    plugins: [nodeResolve()],
  },
  {
    input: 'src/index.js',
    output: [{ file: 'builds/es-compromise.min.js', format: 'umd', name: 'esCompromise' }],
    plugins: [nodeResolve(), terser(opts)],
  },
  {
    input: 'src/index.js',
    output: [{ file: 'builds/es-compromise.mjs', format: 'esm' }],
    plugins: [nodeResolve(), terser(opts)],
  }

]
