import { defineConfig } from 'tsup'

const entry = new URL('src/svelte/index.ts', import.meta.url).pathname
const outDir = new URL('dist/svelte', import.meta.url).pathname

export default defineConfig({
  entry: [entry],
  splitting: false,
  sourcemap: true,
  minify: true,
  external: ['svelte'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  bundle: true,
  outDir,
  plugins: []
})
