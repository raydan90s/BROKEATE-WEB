import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import './index.css'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { router } from '@/routes/rutas'

// El AuthProvider va POR FUERA del router: el guard de cada ruta (RutaProtegida) lee la
// sesión con useAuth, así que el contexto tiene que existir antes de que el router monte
// nada. Es el mismo orden que tenía App.tsx en React Native.
//
// El ThemeProvider envuelve a todo (igual que en App.tsx): cualquier pantalla puede leer
// `useTema`/`useColores`, y la clase `dark` que fija en <html> tiñe la app entera.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
