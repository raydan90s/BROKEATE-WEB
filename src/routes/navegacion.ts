import { useEffect } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'

/**
 * Shim de React Navigation sobre React Router.
 *
 * Las pantallas se portaron con el mínimo de cambios posible: siguen escribiendo
 * `const navigation = useNavigation()` y `navigation.navigate('Propuesta', params)`, y
 * `const route = useRoute()` / `route.params.sessionId`. Este módulo traduce esa API a
 * URLs. Cambiar el import (`@react-navigation/native` → `@/routes/navegacion`) es casi
 * todo lo que hizo falta en cada archivo.
 */

type Params = Record<string, unknown>

function qs(o: Params): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(o)) if (v != null) p.set(k, String(v))
  const s = p.toString()
  return s ? `?${s}` : ''
}

/** Nombre de ruta de React Navigation → URL. `pathname` desambigua ComoSeCalculo, que
 *  existe en el árbol del inversionista y en el del asesor. */
function pathFor(name: string, params: Params = {}, pathname = ''): string {
  const enAsesor = pathname.startsWith('/asesor')
  switch (name) {
    case 'MisSubcuentas':
      return '/'
    case 'NuevaSubcuenta':
      return '/subcuentas/nueva'
    case 'SubcuentaDetalle':
      return `/subcuentas/${params.sessionId}`
    case 'Inicio':
      return '/inicio'
    case 'Cuestionario':
      return '/cuestionario'
    case 'Propuesta':
      return '/propuesta'
    case 'ComoSeCalculo':
      return (
        (enAsesor ? '/asesor/como-se-calculo' : '/como-se-calculo') +
        qs({ investorId: params.investorId, sessionId: params.sessionId })
      )
    case 'Comparador':
      return '/comparador' + qs({ monto: params.monto })
    case 'Simulador':
      return '/simulador'
    case 'Mercados':
      return '/mercados'
    case 'VincularWhatsApp':
      return '/whatsapp'
    case 'DetallePropuesta':
      return `/asesor/propuesta/${params.proposalId}`
    default:
      return '/'
  }
}

export function useNavigation() {
  const nav = useNavigate()
  const { pathname } = useLocation()

  return {
    navigate: (name: string, params?: Params) =>
      nav(pathFor(name, params, pathname), { state: params }),
    replace: (name: string, params?: Params) =>
      nav(pathFor(name, params, pathname), { replace: true, state: params }),
    goBack: () => nav(-1),
    canGoBack: () => window.history.length > 1,
    popToTop: () => nav('/'),
    setOptions: () => {},
  }
}

/** Claves que las pantallas esperan como número aunque en la URL viajen como texto. */
const NUMERICAS = new Set(['monto'])

export function useRoute<T = Params>() {
  const params = useParams()
  const [sp] = useSearchParams()
  const location = useLocation()
  const state = (location.state as Params) ?? {}

  const query: Params = {}
  sp.forEach((v, k) => {
    query[k] = NUMERICAS.has(k) ? Number(v) : v
  })

  // Prioridad: state (navegación en memoria, tipado real) > path params > query.
  return { params: { ...query, ...params, ...state } as T }
}

/**
 * `useFocusEffect` de React Navigation. En RN corría al enfocar la pantalla; en web una
 * ruta se desmonta al salir de ella y se re-monta al volver, así que ejecutar el efecto
 * en el montaje cubre el patrón real ("recargar los datos al regresar").
 */
export function useFocusEffect(effect: () => void | (() => void)) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => effect(), [])
}
