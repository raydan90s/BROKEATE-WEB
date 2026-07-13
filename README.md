# Brokeate — Web

Versión web de Brokeate (robo-advisor, Hackathon de Agentes Financieros IA — Track 3),
portada desde la app React Native a **Vite + React DOM**. Misma paleta, mismo backend.
Es el frontend que se despliega en **Vercel**.

**Demo en vivo: <https://brokeate-web.vercel.app>**

## Los tres repositorios

| Repo | Qué es | Despliegue |
|---|---|---|
| **[BROKEATE-APP](https://github.com/raydan90s/BROKEATE-APP)** | App móvil (Expo / React Native). Es además el paraguas: trae este repo y el backend como submódulos. | [APK](https://expo.dev/accounts/alatacompany/projects/RoboAdvisorApp/builds/3759fec8-8b58-4de2-bf78-8dfe21d00e53) |
| **[BROKEATE-BACKEND](https://github.com/raydan90s/BROKEATE-BACKEND)** | API (FastAPI + Postgres/Supabase + agente LangGraph). | AWS |
| **[BROKEATE-WEB](https://github.com/raydan90s/BROKEATE-WEB)** (este) | Este frontend web. | [Vercel](https://brokeate-web.vercel.app) |

## Requisitos

- Node 20+
- El backend corriendo: el desplegado en AWS, o uno local (ver
  [BROKEATE-BACKEND](https://github.com/raydan90s/BROKEATE-BACKEND)).

## Desarrollo

```bash
npm install
cp .env.example .env      # pon la URL del backend en VITE_API_BASE_URL
npm run dev               # http://localhost:5173
```

## Build

```bash
npm run build             # tsc + vite → dist/
npm run preview           # sirve dist/ localmente
```

## Variables de entorno

Ningún `.env*` se versiona. Copia `.env.example` a `.env`:

- `VITE_API_BASE_URL` — URL del backend (la de AWS, o `http://localhost:8000` en local).
- `VITE_WHATSAPP_NUMERO` — número del bot para prellenar el mensaje de WhatsApp.

## Despliegue (Vercel)

[`vercel.json`](./vercel.json) ya define el build (`npm run build` → `dist/`) y el
rewrite de SPA (`/(.*) → /index.html`, sin él cualquier recarga en una ruta profunda da
404). Lo que **no** viaja en el repo son las variables: hay que declarar
`VITE_API_BASE_URL` y `VITE_WHATSAPP_NUMERO` a mano en Settings → Environment Variables,
y volver a desplegar para que entren al bundle.

## Arquitectura

- **Vite + React 19 + TypeScript**, Tailwind 3.
- `src/components/rn/` — primitivas HTML que emulan las de React Native (`View`, `Text`,
  `Touchable`, `ScrollView`, `TextInput`, `Modal`…), para portar las pantallas con cambios
  mínimos.
- `src/components/Icono.tsx` — `Ionicons` sobre `react-icons/io5`.
- `src/routes/` — React Router (`rutas.tsx`), guard por rol (`RutaProtegida.tsx`) y el shim
  de React Navigation (`navegacion.ts`).
- `src/app/` — pantallas y servicios por dominio (auth, inversionista, asesor, agente,
  whatsapp), portados del proyecto original.

El detalle del port, fase por fase, está en [`PLAN-PORT-WEB.md`](./PLAN-PORT-WEB.md).

## Cuentas de demo

Las siembra el `seed.sql` del backend:

| Correo | Rol | Contraseña |
|---|---|---|
| `inversionista@demo.ec` | inversionista | `demo1234` |
| `juan@demo.ec` | inversionista (perfil Moderado, con datos) | `demo1234` |
| `asesor@demo.ec` | asesor | `demo1234` |
