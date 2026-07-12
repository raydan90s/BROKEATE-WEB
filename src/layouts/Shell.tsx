import type { ReactNode } from 'react'

/**
 * El contenedor de toda la app: el marco a lo ancho de la pantalla.
 *
 * En web hay espacio de sobra, así que el marco lo usa entero (tope en 1600px para que un
 * monitor ultrawide no lo estire hasta lo absurdo). No es que el CONTENIDO se estire a
 * 1600px: cada pantalla centra su propia columna de lectura —angosta en los formularios,
 * ancha y en rejilla en las listas— dentro de este marco. El ancho de lectura por defecto
 * vive en el `ScrollView` de `components/rn`; las listas lo ensanchan con un `max-w-*` mayor.
 *
 * `h-dvh` + `overflow-hidden`, y NO `min-h-dvh`: la app es un marco del alto exacto de la
 * ventana, y lo que scrollea es el ScrollView de cada pantalla, nunca el documento. Con
 * `min-h-dvh` el marco crecía con su contenido, la página entera scrolleaba, y todo lo que
 * debía quedarse fijo abajo —la barra Inicio/Noticias, el botón "Nueva subcuenta"— se iba
 * con ella. Es la misma disciplina que el `body { overflow: hidden }` que Expo pone en web.
 */
export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh overflow-hidden bg-surface-canvas">
      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col overflow-hidden bg-surface-background">
        {children}
      </div>
    </div>
  )
}
