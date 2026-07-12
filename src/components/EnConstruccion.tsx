import { IoArrowBack } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'

import { View } from '@/components/rn'
import Boton from '@/components/shared/Boton'
import { useAuth } from '@/context/AuthContext'

/**
 * Marcador de posición de la Fase 4: la ruta existe y navega, la pantalla todavía no.
 * En la Fase 7 cada una de estas se reemplaza por el port de su archivo en RoboAdvisorApp
 * (la ruta del original está en `origen`, para no tener que buscarla).
 */
export default function EnConstruccion({
  titulo,
  origen,
  lineas,
}: {
  titulo: string
  origen: string
  lineas: number
}) {
  const navigate = useNavigate()
  const { user, role, logout } = useAuth()

  return (
    <div className="flex flex-1 flex-col gap-5 p-5">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="-m-1 flex w-fit items-center gap-1 p-1 text-brand-mid hover:opacity-70"
      >
        <IoArrowBack size={24} />
      </button>

      <div>
        <p className="text-heading font-bold text-brand-ink">{titulo}</p>
        <p className="mt-1 text-body text-text-muted">Pendiente de portar (Fase 7).</p>
      </div>

      <div className="rounded-2xl border border-surface-border bg-surface-elevated p-4">
        <p className="text-caption uppercase text-text-muted">Origen</p>
        <p className="mt-1 break-all text-body text-text-secondary">{origen}</p>
        <p className="mt-1 text-caption text-text-muted">{lineas} líneas por traducir</p>
      </div>

      {user ? (
        <div className="mt-auto rounded-2xl bg-brandAlpha-primarySoft p-4">
          <p className="text-caption uppercase text-brand-primary">Sesión activa</p>
          <p className="mt-1 text-body font-bold text-text-primary">{user.name}</p>
          <p className="text-caption text-text-muted">
            {user.email} · rol: {role}
          </p>
          {/* Primera pantalla que usa un componente portado con las primitivas. */}
          <View className="mt-3">
            <Boton titulo="Cerrar sesión" variante="secundario" onPress={() => void logout()} />
          </View>
        </div>
      ) : null}
    </div>
  )
}
