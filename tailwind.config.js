/** @type {import('tailwindcss').Config} */

// ── Tokens de Brokeate ────────────────────────────────────────────────────────
// Copia literal del theme de RoboAdvisorApp (tailwind.config.js). Los valores NO se
// tocan: son los mismos hex que ya usan las 40 pantallas, así que al portarlas sus
// `className` siguen resolviendo al mismo color. Si cambias uno acá, cámbialo también
// en src/constants/colores.ts (ese archivo existe para las props que no aceptan clases).
//
// Diferencias con el original, y son las únicas dos:
//   1. `export default` en vez de `module.exports` — este repo es "type": "module".
//   2. Sin `presets: [require('nativewind/preset')]` — eso hacía funcionar `className`
//      en React Native; en web Tailwind ya emite CSS de verdad.
//
// Azul marino dominante sobre blanco; verde/ámbar/rojo SOLO semánticos.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontSize: {
        caption: ['12px', { lineHeight: '16px' }],
        body: ['14px', { lineHeight: '20px' }],
        'body-md': ['16px', { lineHeight: '24px' }],
        title: ['18px', { lineHeight: '26px' }],
        heading: ['20px', { lineHeight: '28px' }],
        display: ['24px', { lineHeight: '32px' }],
        hero: ['26px', { lineHeight: '34px' }],
      },
      colors: {
        brand: {
          // Botones, tabs activos y todo lo interactivo.
          primary: '#14375E',
          // Titulares y cifras grandes ("navy" del prototipo).
          ink: '#0A2540',
          // Azules intermedios: chips informativos, segmentos de gráficos.
          mid: '#1E5C9B',
          pale: '#3A85C9',
          // El acento no es lima: verde institucional, solo para "aprobado"/éxito.
          accent: '#1B8A5A',
          // Oro: reservado al segmento "Oro" de los donuts (no es semántico).
          gold: '#B7921A',
        },
        // Color por perfil de riesgo (PROFILE_COLORS del prototipo).
        perfil: {
          conservador: '#14375E',
          moderado: '#C77700',
          agresivo: '#C0362C',
        },
        brandAlpha: {
          primarySoft: '#EBF2FA',
          primaryMedium: 'rgba(20, 55, 94, 0.18)',
          accentSoft: '#E6F5EE',
          accentMedium: 'rgba(27, 138, 90, 0.18)',
        },
        whiteAlpha: {
          ghost: 'rgba(255, 255, 255, 0.10)',
          soft: 'rgba(255, 255, 255, 0.14)',
          medium: 'rgba(255, 255, 255, 0.22)',
        },
        blackAlpha: {
          ghost: 'rgba(0, 0, 0, 0.05)',
        },
        stateAlpha: {
          successSoft: '#E6F5EE',
          errorSoft: '#FFF0EF',
          warningSoft: '#FFF8ED',
        },
        text: {
          primary: '#0A2540',
          secondary: '#3A3F47',
          muted: '#6B7280',
          onPrimary: '#FFFFFF',
          onAccent: '#FFFFFF',
        },
        surface: {
          background: '#FFFFFF',
          secondary: '#F7F8FA',
          elevated: '#F8FAFE',
          border: '#E8EBF0',
          divider: '#E8EBF0',
          canvas: '#F2F5F9',
        },
        state: {
          success: '#1B8A5A',
          warning: '#C77700',
          error: '#C0362C',
          info: '#1E5C9B',
        },
        avatars: {
          1: '#14375E',
          2: '#1E5C9B',
          3: '#3A85C9',
          4: '#1B8A5A',
          5: '#C77700',
          6: '#B7921A',
        },
      },
    },
  },
  plugins: [],
}
