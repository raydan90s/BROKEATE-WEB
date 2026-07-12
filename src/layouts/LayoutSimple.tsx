import { Outlet } from 'react-router-dom'

import Shell from './Shell'

/**
 * Shell sin barra de navegación. Lo usan el login, todo el flujo del inversionista
 * (que es lineal: era un stack, no unos tabs) y —a propósito— el detalle de propuesta
 * del asesor, que no debe mostrar las pestañas mientras decide.
 */
export default function LayoutSimple() {
  return (
    <Shell>
      {/* El Shell ya no scrollea (es del alto exacto de la ventana), así que la pantalla
          necesita su propia zona con scroll. Las que traen ScrollView se bastan solas y
          esta nunca se activa; las que no, al menos no quedan recortadas. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Outlet />
      </div>
    </Shell>
  )
}
