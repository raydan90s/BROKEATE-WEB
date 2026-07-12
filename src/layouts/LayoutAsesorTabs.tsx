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
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      <nav className="flex border-t border-surface-border bg-surface-background">
        {PESTANAS.map(({ a, texto, Icono }) => (
          <NavLink
            key={a}
            to={a}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-3 text-caption font-bold transition-colors ${
                isActive ? 'text-brand-primary' : 'text-text-muted hover:text-brand-mid'
              }`
            }
          >
            <Icono size={22} />
            {texto}
          </NavLink>
        ))}
      </nav>
    </Shell>
  )
}
