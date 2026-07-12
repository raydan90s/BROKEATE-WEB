import { IoLayersOutline, IoTimeOutline } from 'react-icons/io5'
import { NavLink, Outlet } from 'react-router-dom'

import Shell from './Shell'

/**
 * Las dos listas del asesor: cola y auditoría. Son independientes —salta entre ellas, no
 * las recorre en orden— y por eso eran tabs en React Native y son dos rutas hermanas acá.
 *
 * Ojo con lo que **no** cuelga de este layout: `/asesor/propuesta/:id`. El detalle va
 * fuera de las pestañas a propósito (igual que se apilaba encima de los tabs en la app):
 * mientras el asesor decide, la barra no está ahí para que se distraiga y deje la
 * decisión a medias.
 */
const PESTANAS = [
  { a: '/asesor/cola', texto: 'Cola', Icono: IoLayersOutline },
  { a: '/asesor/auditoria', texto: 'Auditoría', Icono: IoTimeOutline },
] as const

export default function LayoutAsesorTabs() {
  return (
    <Shell>
      {/* Arriba, igual que las del inversionista: ver LayoutInversionistaTabs. */}
      <nav className="flex shrink-0 gap-1 border-b border-surface-border bg-surface-background px-4">
        {PESTANAS.map(({ a, texto, Icono }) => (
          <NavLink
            key={a}
            to={a}
            className={({ isActive }) =>
              `flex flex-row items-center gap-2 border-b-2 px-4 py-3 text-body font-bold transition-colors ${
                isActive
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-text-muted hover:text-brand-mid'
              }`
            }
          >
            <Icono size={20} />
            {texto}
          </NavLink>
        ))}
      </nav>

      {/* Sin `min-h-0` esta zona crece y rompe el scroll interno. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Outlet />
      </div>
    </Shell>
  )
}
