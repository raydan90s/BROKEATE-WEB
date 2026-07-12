import { Navigate, Outlet, useLocation } from 'react-router-dom'

import type { Rol } from '@/app/auth/types/auth'
import { useAuth } from '@/context/AuthContext'

/**
 * El equivalente en web de lo que hacía `RootNavigator` en React Native.
 *
 * Allá el árbol de navegación se remontaba entero al cambiar `token`/`role`, así que las
 * pantallas del asesor **ni existían** para un inversionista. En web no hay tal cosa: las
 * rutas son URLs y cualquiera puede teclear `/asesor/cola`. Este guard es lo que
 * reemplaza esa garantía en el cliente.
 *
 * Que quede claro qué es y qué no: esto es **navegación, no seguridad**. El backend
 * revalida el rol del JWT en cada request; si alguien fuerza la URL del asesor, verá el
 * cascarón de la pantalla y la API le dirá que no. Igual que en la app nativa.
 */
export default function RutaProtegida({ rol }: { rol: Rol }) {
  const { token, role, isLoading } = useAuth()
  const location = useLocation()

  // Mientras se lee la sesión de localStorage. Sin esto se vería un parpadeo del login
  // antes de restaurar al usuario ya logueado (mismo motivo que en RootNavigator).
  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface-background">
        <span className="spinner h-10 w-10 border-4 border-t-brand-primary" />
      </div>
    )
  }

  if (!token || !role) {
    // `state.desde` permite volver a donde iba después de iniciar sesión.
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  }

  // Rol equivocado: no se muestra un 403, se manda a cada uno a su casa.
  if (role !== rol) {
    return <Navigate to={role === 'advisor' ? '/asesor/cola' : '/'} replace />
  }

  return <Outlet />
}
