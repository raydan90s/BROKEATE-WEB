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
      <Outlet />
    </Shell>
  )
}
