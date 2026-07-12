/** @type {import('tailwindcss').Config} */

// Los tokens de Brokeate (colores y escala tipográfica) entran en la Fase 2, copiados
// del tailwind.config.js de RoboAdvisorApp. Aquí solo queda el cableado.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
