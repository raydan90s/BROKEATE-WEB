/**
 * Paleta por tema, para props que NO aceptan className (color de Ionicons,
 * ActivityIndicator, stroke de SVG…). Copia en JS de las variables de src/index.css:
 * si cambias un hex aquí, cambia su triplete allá — son la misma paleta en dos lenguajes.
 *
 * No la importes directamente en una pantalla: usa `useColores()` de
 * @/context/ThemeContext, que devuelve la del tema activo y repinta al alternarlo.
 */
export interface Paleta {
  /** Superficie oscura de marca (portada de noticia sin imagen). */
  navy: string;
  primario: string;
  azulMedio: string;
  azulPalido: string;
  acento: string;
  exito: string;
  advertencia: string;
  error: string;
  info: string;
  oro: string;
  textoPrimario: string;
  textoSecundario: string;
  textoMuted: string;
  /** Etiqueta/icono encima de una superficie llena (botón primario, éxito, error). */
  textoSobrePrimario: string;
  textoSobreAcento: string;
  /** Tarjetas. */
  superficie: string;
  superficieSecundaria: string;
  superficieElevada: string;
  borde: string;
  /** Fondo de pantalla. */
  fondo: string;
  /** Velo detrás de modales y hojas. */
  velo: string;
  /** Serie de los gráficos (donut, línea). */
  grafico: readonly [string, string, string, string, string];
  perfil: Record<'conservador' | 'moderado' | 'agresivo', string>;
}

const CLARA: Paleta = {
  navy: '#0A2540',
  primario: '#14375E',
  azulMedio: '#1E5C9B',
  azulPalido: '#3A85C9',
  acento: '#1B8A5A',
  exito: '#1B8A5A',
  advertencia: '#C77700',
  error: '#C0362C',
  info: '#1E5C9B',
  oro: '#B7921A',
  textoPrimario: '#0A2540',
  textoSecundario: '#3A3F47',
  textoMuted: '#6B7280',
  textoSobrePrimario: '#FFFFFF',
  textoSobreAcento: '#FFFFFF',
  superficie: '#FFFFFF',
  superficieSecundaria: '#F7F8FA',
  superficieElevada: '#F8FAFE',
  borde: '#E8EBF0',
  fondo: '#F2F5F9',
  velo: 'rgba(0,0,0,0.45)',
  grafico: ['#0A2540', '#1E5C9B', '#3A85C9', '#9BB8D4', '#1B8A5A'],
  perfil: {
    conservador: '#14375E',
    moderado: '#C77700',
    agresivo: '#C0362C',
  },
};

const OSCURA: Paleta = {
  navy: '#16233A',
  primario: '#7DB3F0',
  azulMedio: '#9AC7F5',
  azulPalido: '#BAD9F7',
  acento: '#40D698',
  exito: '#40D698',
  advertencia: '#F0B54C',
  error: '#F88074',
  info: '#9AC7F5',
  oro: '#E3BE4F',
  textoPrimario: '#EDF2FA',
  textoSecundario: '#C9D3E0',
  textoMuted: '#9EACBE',
  // En oscuro el botón se aclara, así que su etiqueta se oscurece.
  textoSobrePrimario: '#08101C',
  textoSobreAcento: '#041E16',
  superficie: '#121B2B',
  superficieSecundaria: '#1E293C',
  superficieElevada: '#212D43',
  borde: '#39475E',
  fondo: '#0A111D',
  velo: 'rgba(0,0,0,0.65)',
  grafico: ['#9AC7F5', '#7DB3F0', '#BAD9F7', '#8298B5', '#40D698'],
  perfil: {
    conservador: '#7DB3F0',
    moderado: '#F0B54C',
    agresivo: '#F88074',
  },
};

export const PALETA = { light: CLARA, dark: OSCURA } as const;
