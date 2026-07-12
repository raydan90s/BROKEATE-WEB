import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import './index.css'
import { AuthProvider } from '@/context/AuthContext'
import { router } from '@/routes/rutas'

// El AuthProvider va POR FUERA del router: el guard de cada ruta (RutaProtegida) lee la
// sesión con useAuth, así que el contexto tiene que existir antes de que el router monte
// nada. Es el mismo orden que tenía App.tsx en React Native.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
