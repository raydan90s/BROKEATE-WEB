# Plan: portar el front de RoboAdvisorApp a web (Vite + React DOM)

Estado: **propuesto, sin ejecutar.** Escrito el 11-jul-2026.

Origen: `d:\GitHub\RoboAdvisorApp` (Expo SDK 54 · React Native 0.81 · NativeWind ·
React Navigation).
Destino: este repo (Vite 8 · React 19 · TypeScript · React Compiler).
Backend: `d:\GitHub\ROBOADVISORY-BACKEND` (FastAPI). **No se toca.** El contrato HTTP
es idéntico; lo único que cambia es de dónde sale la URL base.

---

## 0. Lo que este port NO es

No es reescribir 7.267 líneas. El desglose real del código fuente de RoboAdvisorApp:

| Qué | Líneas | Trabajo |
|---|---|---|
| TypeScript puro (`.ts`: tipos, servicios, utils, constantes) | 1.104 | Copiar. Cero cambios, salvo 2 archivos. |
| TSX (pantallas y componentes) | 6.163 | Portar JSX. Mecánico, pero hay que pasar por todo. |

Y el inventario de APIs de React Native usadas resultó benigno — **no hay Reanimated,
ni Lottie, ni `StyleSheet`, ni `FlatList`, ni `Alert`, ni `Dimensions`**. Lo que hay:

| Símbolo RN | Usos | Equivalente web |
|---|---|---|
| `TouchableOpacity` | 165 | `<button>` con `:hover`/`:active` |
| `SafeAreaView` | 67 | `<div>` (en web no existe el notch) |
| `ScrollView` | 55 | `<div class="overflow-y-auto">` |
| `ActivityIndicator` | 27 | spinner CSS (12 líneas, una vez) |
| `TextInput` | 21 | `<input>` / `<textarea>` |
| `KeyboardAvoidingView` | 15 | se borra (el teclado del navegador no tapa nada) |
| `Platform` | 12 | se borra (siempre es web) |
| `Pressable` | 10 | `<button>` |
| `Animated` | 10 | transición CSS |
| `Modal` | 9 | `<dialog>` o overlay `position: fixed` |
| `RefreshControl` | 4 | botón "Actualizar" |
| `Image` | 2 | `<img>` |
| `Linking` | 2 | `window.open` |
| `react-native-svg` | 1 archivo | `<svg>` nativo (mismos atributos) |

Traducción: el port es **tedioso, no arriesgado**. Nada de lo que hay depende de una
capacidad que el navegador no tenga.

---

## Fase 1 — Andamiaje (≈30 min)

Este repo es el scaffold por defecto de Vite (`src/App.tsx` es el contador con los logos).
Se vacía y se instalan las cuatro piezas que faltan:

```bash
cd d:/GitHub/brokeate
npm i react-router-dom react-icons
npm i -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

Decisiones que ya están tomadas, para no re-discutirlas a mitad del port:

- **Tailwind 3, no 4.** El `tailwind.config.js` de RoboAdvisorApp es v3 y se copia tal
  cual (ver Fase 2). Subir a v4 obligaría a reescribir los tokens a `@theme` y no
  compra nada hoy.
- **`react-icons/io5`, no `lucide`.** `io5` *son* los Ionicons: mismos glifos, mismos
  nombres. La conversión es mecánica — kebab-case → `Io` + PascalCase:
  `chevron-forward` → `IoChevronForward`, `logo-whatsapp` → `IoLogoWhatsapp`,
  `lock-closed-outline` → `IoLockClosedOutline`. Son **30 íconos distintos** en toda la
  app. Con `lucide` habría que elegir un glifo parecido 30 veces y la app cambiaría de
  cara sin querer.
- **React Router `createBrowserRouter`.** Ver Fase 4.
- Se borran `src/App.css`, `src/assets/*`, `public/icons.svg` y el contenido de
  `src/index.css` (queda solo con las directivas de Tailwind).

Se añade el alias `@` → `src`, porque **todos** los imports de RoboAdvisorApp lo usan
(`@/components/shared/Boton`). Sin esto, cada archivo copiado hay que reescribirlo:

```ts
// vite.config.ts
import path from 'node:path'
// ...
resolve: { alias: { '@': path.resolve(__dirname, './src') } }
```

Y en `tsconfig.app.json`: `"baseUrl": ".", "paths": { "@/*": ["src/*"] }`.

---

## Fase 2 — Los colores (≈15 min)

Es literalmente un copy-paste de dos archivos, y es todo lo que hace falta para que la
identidad visual sea idéntica:

1. `RoboAdvisorApp/tailwind.config.js` → aquí. Se le quitan **dos líneas**:
   - `presets: [require('nativewind/preset')]` (fuera: eso es lo que hacía funcionar
     `className` en RN)
   - se ajusta `content` a `['./index.html', './src/**/*.{ts,tsx}']`

   Todo lo demás —`brand.primary #14375E`, `brand.ink #0A2540`, `state.success #1B8A5A`,
   `surface.border #E8EBF0`, `perfil.*`, la escala tipográfica `caption`…`hero`— entra
   sin tocar. Los `className` de las 40 pantallas siguen resolviendo a los mismos hex.

2. `src/constants/colores.ts` → aquí, **idéntico**. Es TS puro y lo consumen el donut y
   los íconos.

3. `src/index.css` queda con las tres directivas de `global.css` (`@tailwind base;
   components; utilities;`) más el spinner y el `body { background: #F2F5F9 }`.

> El único riesgo de color: NativeWind y Tailwind web difieren en `gap` dentro de
> `flex-row`. En web funciona igual o mejor, no peor.

---

## Fase 3 — Copiar el TypeScript puro (≈30 min)

Estos 1.104 líneas se mueven **sin abrirlas**, con dos excepciones marcadas:

```
src/constants/colores.ts          ← tal cual
src/utils/formato.ts              ← tal cual (usd, porcentaje, montoConSeparadores…)
src/utils/explicacion.ts          ← tal cual
src/types/navigation.ts           ← se REEMPLAZA en la Fase 4 (rutas de RN)
src/app/auth/types/auth.ts        ← tal cual
src/app/asesor/types/asesor.ts    ← tal cual
src/app/inversionista/types/*.ts  ← tal cual
src/app/*/services/*.ts           ← tal cual (authApi, investorApi, advisorApi,
                                     catalogApi, agentApi, whatsappApi)
src/services/http.ts              ← 1 LÍNEA cambia  ⚠️
src/services/tokenStorage.ts      ← se REESCRIBE (12 líneas) ⚠️
```

**`http.ts`** — solo esta línea:

```diff
- const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
+ const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
```

El resto (`ApiError`, el parseo del `detail` de FastAPI, los 422 de Pydantic) usa `fetch`
estándar y ya funciona en el navegador. Se crea `.env` con
`VITE_API_BASE_URL=http://localhost:8000` y `.env.production` apuntando al backend en
Render.

**`tokenStorage.ts`** — `expo-secure-store` y `AsyncStorage` desaparecen; en web solo hay
`localStorage`. La firma se mantiene `async` para no tocar a `AuthContext`:

```ts
const TOKEN_KEY = 'user_token';
export async function getToken()   { return localStorage.getItem(TOKEN_KEY); }
export async function saveToken(t: string) { localStorage.setItem(TOKEN_KEY, t); }
export async function deleteToken() { localStorage.removeItem(TOKEN_KEY); }
```

**`AuthContext.tsx`** cambia solo sus 2 llamadas a `AsyncStorage.getItem/setItem/removeItem`
por `localStorage`. La lógica (`signIn`, `logout`, el `isLoading` que evita el parpadeo del
login) queda intacta.

Al terminar esta fase, **todo el contrato con el backend Python ya está portado.** Los 21
endpoints (`/api/auth/login`, `/api/investor/profile`, `/api/investor/{id}/portfolio`,
`/api/advisor/queue`, `/api/agent/chat`…) funcionan sin haber escrito una línea nueva.

---

## Fase 4 — Navegación: React Navigation → React Router (≈2 h)

Es el único cambio *arquitectónico* del port. Hoy `RootNavigator.tsx` monta un árbol
distinto según el rol y las pantallas navegan con `navigation.navigate('Propuesta')` y
leen params con `route.params`.

**Mapeo:**

| React Navigation | React Router |
|---|---|
| `useNavigation()` + `.navigate('X', p)` | `useNavigate()` + `navigate('/x/' + p.id)` |
| `.goBack()` | `navigate(-1)` |
| `route.params.sessionId` | `useParams()` |
| `route.params.monto` (opcional) | `useSearchParams()` (`?monto=10000`) |
| Stack del inversionista | rutas hijas bajo `/` |
| Tabs del asesor (Cola / Auditoría) | rutas `/asesor/cola` y `/asesor/auditoria` + una barra de nav propia |
| El árbol que se remonta al cambiar `token`/`role` | `<RutaProtegida rol="investor">` que redirige a `/login` |

**Tabla de rutas** (deriva de `src/types/navigation.ts`, que se borra y se sustituye por esto):

```
/login                          LoginPage

/                               MisSubcuentasPage        (home del inversionista)
/subcuentas/nueva               NuevaSubcuentaPage
/subcuentas/:sessionId          SubcuentaDetallePage
/cuestionario                   CuestionarioPage
/propuesta                      PropuestaPage
/como-se-calculo                ComoSeCalculoPage        (?investorId=&sessionId=)
/comparador                     ComparadorPage           (?monto=)
/simulador                      SimuladorPage
/whatsapp                       VincularWhatsAppPage
/inicio                         InicioPage               (flujo de cartera única, sigue vivo)

/asesor/cola                    ColaRevisionPage
/asesor/auditoria               AuditoriaPage
/asesor/propuesta/:proposalId   DetallePropuestaPage
```

Dos cosas que el port **mejora** por venir a web, y hay que aprovecharlas porque son gratis:

- Las URLs pasan a ser compartibles. El asesor puede mandar el link de una propuesta.
- El botón "atrás" del navegador funciona solo.

Y una que hay que **preservar a conciencia**: el detalle de propuesta del asesor hoy se
apila *encima* de los tabs a propósito (el comentario en `RootNavigator.tsx` lo dice: para
que no se distraiga y deje la decisión a medias). En web eso significa que `/asesor/propuesta/:id`
**no** debe renderizar la barra de navegación del asesor.

`navigationRef` / `rootNavigation.ts` se borra: React Router navega fuera de componentes con
el `router` de `createBrowserRouter`.

---

## Fase 5 — Primitivas (≈1 h, y ahorra las 20 h siguientes)

Antes de tocar una sola pantalla, se crean 6 componentes en `src/components/rn/`. **No es
un port de `react-native-web`**: son wrappers HTML que aceptan `className` y ya, de modo que
las 40 pantallas se puedan portar cambiando el import y casi nada más.

```tsx
// src/components/rn/index.tsx
export const View = ({ className, children, ...p }) =>
  <div className={className} {...p}>{children}</div>;

export const Text = ({ className, children, ...p }) =>
  <span className={className} {...p}>{children}</span>;

export const ScrollView = ({ className, contentContainerClassName, children }) =>
  <div className={`overflow-y-auto ${className}`}>
    <div className={contentContainerClassName}>{children}</div>
  </div>;

export const Touchable = ({ onPress, disabled, className, children }) =>
  <button type="button" onClick={onPress} disabled={disabled}
          className={`text-left transition-opacity hover:opacity-85
                      disabled:opacity-50 ${className}`}>{children}</button>;

export const ActivityIndicator = ({ color = '#14375E', size = 'small' }) => /* spinner CSS */;

export const SafeArea = ({ className, children }) =>
  <div className={`min-h-dvh ${className}`}>{children}</div>;
```

⚠️ **Trampa que hay que conocer antes, no descubrir después:** en React Native, `View` es
`display: flex` + `flex-direction: column` **por defecto**; en HTML, `div` es `display: block`.
Si no se ajusta, cada `<View className="gap-2">` de las pantallas pierde su layout y todo
se ve apilado sin espacios. Dos formas de resolverlo, hay que elegir una en la Fase 5 y no
mezclarlas:

- **(a) recomendada)** `View` lleva `flex flex-col` de base: `className={\`flex flex-col ${className}\`}`.
  Los `flex-row` de las pantallas siguen ganando porque van después. Cero cambios en las pantallas.
- (b) Buscar y anotar cada `View` a mano. 300+ ediciones. No.

Lo mismo con `Text`: en RN el texto **no** hereda estilos de su padre; en HTML sí. Eso juega
a favor y no hay que hacer nada.

Con esta capa, portar `Boton.tsx` (36 líneas) queda en cambiar 1 import y 3 identificadores.

---

## Fase 6 — Portar los componentes compartidos (≈2 h)

En este orden, porque las pantallas los consumen:

1. `Tarjeta.tsx` (14 líneas) — trivial
2. `Boton.tsx` (36) — `TouchableOpacity` → `Touchable`, `ActivityIndicator`
3. `BotonAtras.tsx` (24) — `Ionicons` → `IoArrowBack`; `hitSlop` se cae (en desktop no hay pulgar)
4. `EstadoBadge.tsx` (32) — solo `View`/`Text`
5. `DisclaimerBanner.tsx` (18) — ⚠️ **no le pongas botón de cerrar.** El comentario del
   archivo explica por qué: es el criterio 3 de HU2. Portarlo tal cual.
6. `Calificacion.tsx` (44) — ⚠️ el pie con fuente y fecha **no es opcional** (antialucinación).
7. `Estados.tsx` (48) — `Cargando` / `ErrorEstado` / `Vacio`
8. `ExplicacionIA.tsx` (95) — el `useMemo` + `useState` funcionan igual; solo cambia el JSX
9. `SelectorInstrumento.tsx` (63)
10. `DonutPortafolio.tsx` (90) — **el único con SVG.** `react-native-svg` → `<svg>` del DOM.
    Los atributos son los mismos (`strokeDasharray`, `strokeDashoffset`, `cx`, `cy`, `r`),
    así que el cambio es: `<Svg width h>` → `<svg width h>`, `<Circle>` → `<circle>`,
    `<G rotation={-90} originX originY>` → `<g transform="rotate(-90 87 87)">`. El texto del
    centro pasa de `<View className="absolute">` a un `<div>` con `position:absolute` dentro de
    un contenedor `relative`.

---

## Fase 7 — Portar las pantallas (el grueso: ≈12–16 h)

**En este orden**, que es el de la demo y también el del riesgo. La línea de corte está
marcada: si el reloj se acaba, se entrega lo que esté por encima de ella.

| # | Pantalla | Líneas | Nota |
|---|---|---|---|
| 1 | `LoginPage` | 219 | `TextInput` → `<input>`; envolver en `<form onSubmit>` (gratis: Enter para enviar) |
| 2 | `MisSubcuentasPage` | 319 | home; `RefreshControl` → botón "Actualizar" |
| 3 | `CuestionarioPage` | 190 | |
| 4 | `PropuestaPage` + `VistaPropuesta` | 467+ | el corazón de HU1; usa donut + `ExplicacionIA` + disclaimer |
| 5 | `NuevaSubcuentaPage` | 377 | ⚠️ inputs de monto: `montoConSeparadores` al teclear, `montoANumero` al enviar |
| 6 | `SubcuentaDetallePage` | — | |
| 7 | `ColaRevisionPage` | 138 | asesor; en desktop **gana mucho** como tabla ancha |
| 8 | `DetallePropuestaPage` | 529 | la más grande; HU3 |
| 9 | `ComoSeCalculoPage` | 197 | antialucinación (criterio #3) |
| 10 | `AgenteFab` + `AgentSheet` + `Burbuja` + `ProviderSelector` | 456 | `Animated` → transición CSS; el sheet inferior en desktop puede ser panel lateral |
| — | **── línea de corte ──** | | |
| 11 | `AuditoriaPage` + `EventoAuditoriaModal` | 662 | `Modal` → `<dialog>` |
| 12 | `SimuladorPage` | 516 | |
| 13 | `ComparadorPage` | 194 | |
| 14 | `VincularWhatsAppPage` | 297 | `Linking` → `window.open` |
| 15 | `InicioPage` / `HomePage` | 164+ | flujo de cartera única (hoy no es la ruta inicial) |

**Regla de oro del port:** en esta pasada **no se rediseña nada.** Se traduce. Cada pantalla
queda con el layout móvil dentro de un contenedor centrado (Fase 8). Rediseñar a dos columnas
o tabla ancha (la cola del asesor lo pide a gritos) es la Fase 9 — y solo si sobra tiempo.
Mezclar traducción y rediseño en la misma pasada es cómo un port de 16 h se convierte en uno
de 40.

---

## Fase 8 — Shell de la app y despliegue (≈1 h)

```tsx
// El contenedor que hace que no se vea como una app estirada
<div className="min-h-dvh bg-surface-canvas">
  <div className="mx-auto w-full max-w-[480px] bg-surface-background min-h-dvh">
    <Outlet />
  </div>
</div>
```

Móvil-primero centrado sobre el canvas `#F2F5F9`: se lee como una web deliberadamente
estrecha (Wise, Revolut), no como una app móvil que sobró. Las pantallas del asesor son
las candidatas a romper ese `max-w` y usar el ancho completo.

Despliegue en Vercel: `vite build` → `dist/`. Hace falta el rewrite de SPA (igual que el
`vercel.json` que ya tiene RoboAdvisorApp), o `/asesor/cola` da 404 al recargar:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Y `VITE_API_BASE_URL` como variable de entorno en Vercel. **CORS:** el backend FastAPI tiene
que permitir el origen nuevo de Vercel — es lo único que hay que tocar del lado de Python, y
es una línea en su `CORSMiddleware`.

---

## Presupuesto y realidad

| Fase | Estimado |
|---|---|
| 1 · Andamiaje | 0,5 h |
| 2 · Colores | 0,25 h |
| 3 · TS puro + servicios | 0,5 h |
| 4 · Router | 2 h |
| 5 · Primitivas | 1 h |
| 6 · Compartidos | 2 h |
| 7 · Pantallas | 12–16 h |
| 8 · Shell + deploy | 1 h |
| **Total** | **≈20–24 h** |

**Contra el deadline del hackathon (domingo 12-jul-2026, 23:59) esto no cabe completo.**
Las fases 1–6 son ~6 h y son las de menor riesgo; la 7 es la que no entra entera. Dos
salidas honestas:

- **Plan A (seguro):** desplegar mañana el export web de Expo que RoboAdvisorApp *ya* produce
  (`npm run vercel-build`), y ejecutar este plan con calma después de la entrega. El
  entregable "despliegue" del correo queda cubierto.
- **Plan B (agresivo):** ejecutar fases 1–6 + los ítems 1–4 de la fase 7 (login, home,
  cuestionario, propuesta) y desplegar **eso** como la web, dejando al asesor y al agente en
  la app Expo. Se entregan dos URLs. Riesgo real de llegar con las dos a medias.

Mi recomendación es el Plan A. Este documento no caduca el lunes; el deadline sí.
