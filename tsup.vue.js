import { defineConfig } from 'tsup'

const entry = new URL('src/vue/index.ts', import.meta.url).pathname
const outDir = new URL('dist/vue', import.meta.url).pathname

export default defineConfig({
  entry: [entry],
  splitting: false,
  sourcemap: true,
  minify: true,
  external: ['vue'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  bundle: true,
  outDir,
  noExternal: ['@orama']
})
