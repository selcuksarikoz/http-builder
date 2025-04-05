import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts()],
  build: {
    minify: true,
    lib: {
      entry: 'src/index.ts',
      name: 'index',
      fileName: 'index',
      formats: ['es', 'cjs', 'umd'],
    },
    rollupOptions: {
      output: {
      },
    },
  },
})
