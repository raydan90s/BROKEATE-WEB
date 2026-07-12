import type { ReactNode } from 'react'

/**
 * El contenedor de toda la app: el marco a lo ancho de la pantalla.
 *
 * En web hay espacio de sobra, así que el marco lo usa entero (tope en 1600px para que un
 * monitor ultrawide no lo estire hasta lo absurdo). No es que el CONTENIDO se estire a
 * 1600px: cada pantalla centra su propia columna de lectura —angosta en los formularios,
 * ancha y en rejilla en las listas— dentro de este marco. El ancho de lectura por defecto
 * vive en el `ScrollView` de `components/rn`; las listas lo ensanchan con un `max-w-*` mayor.
 */
export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface-canvas">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1600px] flex-col bg-surface-background">
        {children}
      </div>
    </div>
  )
}
