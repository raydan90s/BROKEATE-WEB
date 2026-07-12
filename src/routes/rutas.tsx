import { createBrowserRouter, Navigate } from 'react-router-dom'

import LoginPage from '@/app/auth/pages/LoginPage'
import AuditoriaPage from '@/app/asesor/pages/AuditoriaPage'
import ColaRevisionPage from '@/app/asesor/pages/ColaRevisionPage'
import DetallePropuestaPage from '@/app/asesor/pages/DetallePropuestaPage'
import ComoSeCalculoPage from '@/app/inversionista/pages/ComoSeCalculoPage'
import ComparadorPage from '@/app/inversionista/pages/ComparadorPage'
import CuestionarioPage from '@/app/inversionista/pages/CuestionarioPage'
import InicioPage from '@/app/inversionista/pages/InicioPage'
import MercadosSimuladorPage from '@/app/inversionista/pages/MercadosSimuladorPage'
import MisSubcuentasPage from '@/app/inversionista/pages/MisSubcuentasPage'
import NuevaSubcuentaPage from '@/app/inversionista/pages/NuevaSubcuentaPage'
import PropuestaPage from '@/app/inversionista/pages/PropuestaPage'
import SimuladorPage from '@/app/inversionista/pages/SimuladorPage'
import SubcuentaDetallePage from '@/app/inversionista/pages/SubcuentaDetallePage'
import VincularWhatsAppPage from '@/app/whatsapp/pages/VincularWhatsAppPage'
import LayoutAsesorTabs from '@/layouts/LayoutAsesorTabs'
import LayoutSimple from '@/layouts/LayoutSimple'
import RutaProtegida from '@/routes/RutaProtegida'

/**
 * Las rutas de Brokeate en web. Reemplazan a los tres navegadores de React Navigation
 * (`AuthStack`, `InvestorStack`, `AdvisorStack` + tabs) de `src/types/navigation.ts`.
 *
 * Lo que se gana al pasar a URLs y conviene no desperdiciar:
 *   · los enlaces son compartibles (el asesor puede mandar el link de una propuesta);
 *   · el botón "atrás" del navegador funciona solo.
 *
 * Lo que hay que preservar a conciencia: los params que antes viajaban en el objeto de
 * navegación ahora son parte de la URL, y eso los vuelve **visibles y editables**. No es
 * un agujero nuevo: `sessionId` y `proposalId` nunca fueron un permiso, el backend
 * siempre verificó contra el token que el recurso fuera del usuario. Sigue siendo así.
 */
export const router = createBrowserRouter([
  {
    element: <LayoutSimple />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },

  // ── Inversionista ────────────────────────────────────────────────────────────
  {
    element: <RutaProtegida rol="investor" />,
    children: [
      {
        element: <LayoutSimple />,
        children: [
          { index: true, element: <MisSubcuentasPage /> },
          { path: '/subcuentas/nueva', element: <NuevaSubcuentaPage /> },
          { path: '/subcuentas/:sessionId', element: <SubcuentaDetallePage /> },

          // Flujo de cartera única. Sigue vivo: es a lo que se revierte si las
          // subcuentas no llegan (volver = hacer de /inicio la ruta índice).
          { path: '/inicio', element: <InicioPage /> },
          { path: '/cuestionario', element: <CuestionarioPage /> },
          { path: '/propuesta', element: <PropuestaPage /> },

          // Params opcionales por query: ?investorId=&sessionId= · ?monto=
          { path: '/como-se-calculo', element: <ComoSeCalculoPage /> },
          { path: '/comparador', element: <ComparadorPage /> },
          { path: '/simulador', element: <SimuladorPage /> },
          { path: '/mercados', element: <MercadosSimuladorPage /> },
          { path: '/whatsapp', element: <VincularWhatsAppPage /> },
        ],
      },
    ],
  },

  // ── Asesor ───────────────────────────────────────────────────────────────────
  {
    path: '/asesor',
    element: <RutaProtegida rol="advisor" />,
    children: [
      {
        // Cola y auditoría: dos listas independientes → pestañas.
        element: <LayoutAsesorTabs />,
        children: [
          { index: true, element: <Navigate to="/asesor/cola" replace /> },
          { path: 'cola', element: <ColaRevisionPage /> },
          { path: 'auditoria', element: <AuditoriaPage /> },
        ],
      },
      {
        // Fuera de las pestañas, a propósito: mientras decide, el asesor no navega.
        element: <LayoutSimple />,
        children: [
          { path: 'propuesta/:proposalId', element: <DetallePropuestaPage /> },
          { path: 'como-se-calculo', element: <ComoSeCalculoPage /> },
        ],
      },
    ],
  },

  // Cualquier otra cosa: a la raíz, que el guard ya sabe a dónde mandar a cada rol.
  { path: '*', element: <Navigate to="/" replace /> },
])
