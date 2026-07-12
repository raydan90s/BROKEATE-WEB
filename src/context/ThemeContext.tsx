import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { PALETA, type Paleta } from '@/constants/colores';

const TEMA_KEY = '@roboadvisor_tema';

/** 'system' sigue al SO; 'light'/'dark' lo fija el usuario desde el header. */
export type PreferenciaTema = 'light' | 'dark' | 'system';
export type Tema = 'light' | 'dark';

interface ThemeContextValue {
  /** El tema realmente pintado ('system' ya resuelto). */
  tema: Tema;
  esOscuro: boolean;
  /** Lo que eligió el usuario. Es lo que se persiste. */
  preferencia: PreferenciaTema;
  /** Paleta del tema activo, para props que exigen un string de color. */
  colores: Paleta;
  elegir: (preferencia: PreferenciaTema) => void;
  /** Salta al tema contrario al que se ve ahora mismo. */
  alternar: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function leerPreferencia(): PreferenciaTema {
  try {
    const g = localStorage.getItem(TEMA_KEY);
    if (g === 'light' || g === 'dark' || g === 'system') return g;
  } catch {
    /* localStorage puede estar bloqueado (modo privado); caemos a 'system'. */
  }
  return 'system';
}

function prefiereOscuroSO(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

/**
 * Fuente única del tema en web.
 *
 * Es el gemelo del ThemeContext de RoboAdvisorApp, pero sin NativeWind: aquí quien manda
 * es la clase `dark` en <html>. Al ponerla/quitarla, `.dark:root` de index.css toma el
 * relevo y toda clase con token (`bg-surface-canvas`, `text-text-primary`…) se repinta
 * sola. Este contexto solo añade lo que el CSS no hace: recordar la elección entre
 * recargas y exponer la paleta como strings para las props que no aceptan className.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preferencia, setPreferencia] = useState<PreferenciaTema>(leerPreferencia);
  const [oscuroSO, setOscuroSO] = useState<boolean>(prefiereOscuroSO);

  // Mientras la preferencia sea 'system', el tema sigue en vivo al SO.
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const alCambiar = (e: MediaQueryListEvent) => setOscuroSO(e.matches);
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, []);

  const tema: Tema = preferencia === 'system' ? (oscuroSO ? 'dark' : 'light') : preferencia;
  const colores = PALETA[tema];

  // Pinta el <html>: `.dark:root` toma el relevo. `color-scheme` alinea los controles
  // nativos (scrollbars, autofill, date pickers) con el tema.
  useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.toggle('dark', tema === 'dark');
    raiz.style.colorScheme = tema;
  }, [tema]);

  const elegir = useCallback((nueva: PreferenciaTema) => {
    setPreferencia(nueva);
    try {
      localStorage.setItem(TEMA_KEY, nueva);
    } catch {
      /* sin persistencia: la elección vive lo que dure la pestaña. */
    }
  }, []);

  const alternar = useCallback(() => {
    elegir(tema === 'dark' ? 'light' : 'dark');
  }, [elegir, tema]);

  const valor = useMemo<ThemeContextValue>(
    () => ({
      tema,
      esOscuro: tema === 'dark',
      preferencia,
      colores,
      elegir,
      alternar,
    }),
    [tema, preferencia, colores, elegir, alternar],
  );

  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>;
}

export function useTema(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTema debe usarse dentro de ThemeProvider');
  return ctx;
}

/** Atajo para el caso común: solo necesitas los colores (icono, spinner, SVG). */
export function useColores(): Paleta {
  return useTema().colores;
}
