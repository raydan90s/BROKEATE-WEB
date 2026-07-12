import path from 'node:path'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  // Todo el front de RoboAdvisorApp importa como `@/components/...`. Sin este alias
  // habría que reescribir el encabezado de cada archivo que se copie.
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
})
