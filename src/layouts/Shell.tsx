import type { ReactNode } from 'react'

/**
 * El contenedor de toda la app: columna centrada sobre el canvas.
 *
 * Móvil-primero centrado, no estirado a 1920px: así se lee como una web deliberadamente
 * estrecha (Wise, Revolut) y no como una app móvil que sobró en el navegador. Las
 * pantallas del asesor son las candidatas a romper este ancho (Fase 9, si hay tiempo).
 */
export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface-canvas">
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface-background">
        {children}
      </div>
    </div>
  )
}
