import { IoNewspaperOutline, IoWalletOutline } from 'react-icons/io5'
import { Link, Outlet, useLocation } from 'react-router-dom'

import Shell from './Shell'

/**
 * El layout del inversionista: su operación en una pestaña y las noticias en la otra.
 * Espejo del `InvestorTabs` de React Navigation en la app — el feed queda a un toque
 * desde cualquier pantalla del flujo, que era el punto de la sugerencia del jurado.
 *
 * "Inicio" agrupa TODO el flujo (subcuentas, cuestionario, propuesta…): la pestaña sigue
 * activa en cualquiera de esas rutas y solo cede el brillo a "Noticias" cuando estás en
 * `/noticias`. Por eso el estado activo se calcula a mano y no con el `end` de `NavLink`:
 * un `NavLink to="/"` sin `end` marcaría todas las rutas como activas a la vez.
 */
export default function LayoutInversionistaTabs() {
  const { pathname } = useLocation()
  const enNoticias = pathname === '/noticias'

  const pestanas = [
    { a: '/', texto: 'Inicio', Icono: IoWalletOutline, activo: !enNoticias },
    { a: '/noticias', texto: 'Noticias', Icono: IoNewspaperOutline, activo: enNoticias },
  ]

  return (
    <Shell>
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      <nav className="flex border-t border-surface-border bg-surface-background">
        {pestanas.map(({ a, texto, Icono, activo }) => (
          <Link
            key={a}
            to={a}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-caption font-bold transition-colors ${
              activo ? 'text-brand-primary' : 'text-text-muted hover:text-brand-mid'
            }`}
          >
            <Icono size={22} />
            {texto}
          </Link>
        ))}
      </nav>
    </Shell>
  )
}
