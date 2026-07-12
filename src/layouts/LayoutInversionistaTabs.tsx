import { IoLogOutOutline, IoNewspaperOutline, IoWalletOutline } from 'react-icons/io5'
import { Link, Outlet, useLocation } from 'react-router-dom'

import BotonTema from '@/components/shared/BotonTema'
import { useAuth } from '@/context/AuthContext'

import Shell from './Shell'

/**
 * El layout del inversionista: su operación en una pestaña y las noticias en la otra.
 * Espejo del `InvestorTabs` de React Navigation en la app — el feed queda a un clic desde
 * cualquier pantalla del flujo, que era el punto de la sugerencia del jurado.
 *
 * "Inicio" agrupa TODO el flujo (subcuentas, cuestionario, propuesta…): la pestaña sigue
 * activa en cualquiera de esas rutas y solo cede el brillo a "Noticias" cuando estás en
 * `/noticias`. Por eso el estado activo se calcula a mano y no con el `end` de `NavLink`:
 * un `NavLink to="/"` sin `end` marcaría todas las rutas como activas a la vez.
 *
 * Es UNA barra, no dos. Antes había un tab bar abajo (traducción literal del de la app,
 * donde tiene sentido porque es donde llega el pulgar) y encima una cabecera con el saludo
 * y los botones. En escritorio no hay pulgar: la navegación se busca arriba, y dos barras
 * apiladas se comían el alto útil. Aquí van juntos el saludo, las pestañas y las acciones;
 * el pie queda libre para lo que sí es de la pantalla — el sticky de "Nueva subcuenta".
 *
 * El saludo y el logout viven ACÁ y no en cada pantalla: son de la sesión, no de la página.
 */
export default function LayoutInversionistaTabs() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const enNoticias = pathname === '/noticias'

  const pestanas = [
    { a: '/', texto: 'Inicio', Icono: IoWalletOutline, activo: !enNoticias },
    { a: '/noticias', texto: 'Noticias', Icono: IoNewspaperOutline, activo: enNoticias },
  ]

  return (
    <Shell>
      <header className="flex shrink-0 flex-row items-center gap-4 border-b border-surface-border bg-surface-background px-5 py-3">
        {user ? (
          <span className="truncate text-heading font-bold text-text-primary">
            Hola, {user.name}
          </span>
        ) : null}

        <nav className="flex flex-1 flex-row gap-1">
          {pestanas.map(({ a, texto, Icono, activo }) => (
            <Link
              key={a}
              to={a}
              // El subrayado (y no solo el color) es lo que marca la pestaña activa: el
              // color por sí solo deja fuera a quien no distingue el azul del gris.
              className={`flex flex-row items-center gap-2 border-b-2 px-4 py-2 text-body font-bold transition-colors ${
                activo
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-text-muted hover:text-brand-mid'
              }`}
            >
              <Icono size={20} />
              {texto}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 flex-row items-center gap-2">
          <BotonTema />
          <button
            type="button"
            onClick={logout}
            aria-label="Cerrar sesión"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary text-text-primary transition-opacity hover:opacity-80"
          >
            <IoLogOutOutline size={20} />
          </button>
        </div>
      </header>

      {/* `min-h-0` es lo que obliga a esta zona a scrollear en vez de crecer: un hijo flex
          no baja de su altura de contenido sin él, y al crecer empujaba la barra fuera de
          la ventana. Con esto la cabecera se queda fija arriba pase lo que pase. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Outlet />
      </div>
    </Shell>
  )
}
