import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { login } from '@/app/auth/services/authApi'
import { useAuth } from '@/context/AuthContext'

/**
 * Login mínimo de la Fase 4. **No es el port de LoginPage** (219 líneas, con registro):
 * eso llega en la Fase 7. Existe para que el guard por rol sea verificable — sin poder
 * autenticarse de verdad, las rutas protegidas no se pueden probar.
 */
export default function LoginPage() {
  const { token, role, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { desde?: string } }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  // Ya logueado: no tiene sentido ver el login. Cada rol a su casa.
  if (token && role) {
    const destino = location.state?.desde ?? (role === 'advisor' ? '/asesor/cola' : '/')
    return <Navigate to={destino} replace />
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)
    try {
      const respuesta = await login({ email, password })
      await signIn(respuesta)
      navigate(respuesta.role === 'advisor' ? '/asesor/cola' : '/', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 p-6">
      <div>
        <p className="text-hero font-bold text-brand-ink">Brokeate</p>
        <p className="text-body text-text-muted">Inicia sesión para continuar.</p>
      </div>

      {/* <form> y no un onClick: así Enter envía, gratis, cosa que en RN no existía. */}
      <form onSubmit={enviar} className="flex flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.ec"
          autoComplete="email"
          className="rounded-2xl border border-surface-border bg-surface-background px-4 py-3.5 text-body-md text-text-primary outline-none focus:border-brand-primary"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          autoComplete="current-password"
          className="rounded-2xl border border-surface-border bg-surface-background px-4 py-3.5 text-body-md text-text-primary outline-none focus:border-brand-primary"
        />

        {error ? (
          <div className="rounded-2xl bg-stateAlpha-errorSoft px-4 py-3">
            <p className="text-body text-state-error">{error}</p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={cargando}
          className="rounded-2xl bg-brand-primary px-6 py-3.5 text-body-md font-bold text-text-onPrimary transition-opacity hover:opacity-85 disabled:bg-brandAlpha-primaryMedium"
        >
          {cargando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      {/* Atajo de demo. Se va con el port real de la Fase 7. */}
      <div className="rounded-2xl bg-brandAlpha-primarySoft p-4">
        <p className="text-caption uppercase text-brand-primary">Cuentas de demo</p>
        <div className="mt-2 flex gap-2">
          {(['inversionista', 'asesor'] as const).map((quien) => (
            <button
              key={quien}
              type="button"
              onClick={() => {
                setEmail(`${quien}@demo.ec`)
                setPassword('demo1234')
              }}
              className="rounded-xl bg-surface-background px-3 py-2 text-caption font-bold text-brand-mid hover:opacity-85"
            >
              {quien}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
