# Plan: portar el front de RoboAdvisorApp a web (Vite + React DOM)

Escrito el 11-jul-2026. **Fases 1–4 ejecutadas y verificadas.** Siguiente: Fase 5.

| Fase | Estado |
|---|---|
| 1 · Andamiaje | ✅ hecha — `npm run build` pasa |
| 2 · Colores | ✅ hecha — tokens verificados en el CSS del build |
| 3 · TypeScript puro + servicios | ✅ hecha — 1.102 líneas; el backend responde |
| 4 · Router | ✅ hecha — 14 rutas + guard por rol; login real contra el backend |
| 5 · Primitivas | ✅ hecha — 10 primitivas; cascada verificada |
| 6 · Componentes compartidos | ✅ hecha — 10/10; donut SVG verificado por SSR |
| 7 · Pantallas | ✅ hecha — 15 pantallas + agente; build limpio |
| 8 · Shell + despliegue | ⬜ (pendiente: desplegar en Vercel) |

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

## Fase 1 — Andamiaje ✅ (hecha en ~25 min)

Este repo era el scaffold por defecto de Vite (`src/App.tsx` era el contador con los logos).
Se vació y se instalaron las piezas que faltaban:

```bash
cd d:/GitHub/brokeate
npm i react-router-dom react-icons
npm i -D tailwindcss@3 postcss autoprefixer
```

> ⚠️ **`npx tailwindcss init -p` NO se usó, a propósito.** El `package.json` declara
> `"type": "module"`, y ese comando escribe `tailwind.config.js` y `postcss.config.js`
> con `module.exports` (CommonJS) → el build revienta. Ambos configs se escribieron a
> mano con `export default`. Si alguien vuelve a correr `init -p`, romperá el repo.

Decisiones tomadas, para no re-discutirlas a mitad del port:

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

Se añadió el alias `@` → `src`, porque **todos** los imports de RoboAdvisorApp lo usan
(`@/components/shared/Boton`). Sin esto, cada archivo copiado habría que reescribirlo.
Son **dos** configuraciones distintas y hay que tocar las dos (es clásico que una resuelva
y la otra no; se verificó compilando un import real):

```ts
// vite.config.ts
resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } }
```

```jsonc
// tsconfig.app.json  ── sin baseUrl:
"paths": { "@/*": ["./src/*"] }
```

> ⚠️ **`baseUrl` no se puede usar.** El repo va con TypeScript 6, que lo deprecó: el build
> falla con `TS5101`. No hace falta — desde TS 5.5 los `paths` resuelven relativo al propio
> tsconfig.

**Entorno.** El backend ya está desplegado, así que la web funciona sin levantar Python
en local:

```
VITE_API_BASE_URL=https://hackaton.api.alata-ec.com
VITE_WHATSAPP_NUMERO=+12566808498
```

> ⚠️ **Ningún `.env*` se versiona** (`.gitignore`: `.env` y `.env.*`). Consecuencia para la
> Fase 8: **hay que declarar `VITE_API_BASE_URL` a mano en el dashboard de Vercel.** Si se
> olvida, `BASE_URL` queda en `''`, las llamadas pegan contra el dominio de Vercel en vez
> del backend, y el síntoma es feo y silencioso: la app carga y el login da error de red.

**Deuda conocida:** `tsconfig.app.json` no tiene `strict`, pero sí `noUnusedLocals` y
`noUnusedParameters`. Lo segundo va a ladrar al portar pantallas (imports de RN que quedan
sin uso). Se decidió no relajarlo por ahora.

---

## Fase 2 — Los colores ✅ (hecha en ~15 min)

Fue el copy-paste que prometía, y con eso la identidad visual ya es idéntica:

1. `RoboAdvisorApp/tailwind.config.js` → [`tailwind.config.js`](./tailwind.config.js), con
   **tres** cambios y ninguno más:
   - `export default` en vez de `module.exports` (el `"type": "module"` de arriba)
   - fuera `presets: [require('nativewind/preset')]` — eso era lo que hacía funcionar
     `className` en RN; en web Tailwind emite CSS de verdad
   - `content: ['./index.html', './src/**/*.{ts,tsx}']`

   Todo lo demás —`brand.primary #14375E`, `brand.ink #0A2540`, `state.success #1B8A5A`,
   `surface.border #E8EBF0`, `perfil.*`, la escala `caption`…`hero`— entró sin tocar.

2. `src/constants/colores.ts` → [aquí](./src/constants/colores.ts), **byte por byte
   idéntico** (`diff` limpio). Lo consumen el donut y los íconos, que no aceptan `className`.

3. [`src/index.css`](./src/index.css): las tres directivas de Tailwind, el canvas
   `#F2F5F9` en el `body`, y la clase `.spinner` (keyframes CSS) que reemplazará al
   `ActivityIndicator` en la Fase 5.

**Verificado, no supuesto:** se extrajeron los colores del CSS del build y cada token sale
con su valor correcto — `brand.primary` → `20 55 94`, `brand.ink` → `10 37 64`,
`state.success` → `27 138 90`, `state.error` → `192 54 44`, `surface.border` →
`232 235 240`; y la escala tipográfica en 12/14/16/26px.

> ⚠️ **Los hex no aparecen como hex en el CSS.** Tailwind v3 los compila a
> `rgb(20 55 94 / var(--tw-bg-opacity))` para poder aplicar opacidades. Buscar `#14375E`
> en `dist/assets/*.css` da cero y parece roto — no lo está. Y un token que no use ninguna
> pantalla sencillamente no se emite: el JIT solo genera las clases usadas.

> Riesgo residual de color: NativeWind y Tailwind web difieren en `gap` dentro de
> `flex-row`. En web funciona igual o mejor, no peor.

---

## Fase 3 — Copiar el TypeScript puro ✅ (hecha en ~30 min)

Se movieron **1.102 líneas** prácticamente sin abrirlas. Cumplió lo prometido: al terminar,
todo el contrato con el backend Python está portado sin haber escrito lógica nueva.

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

### Lo que apareció al ejecutarla

> ⚠️ **`erasableSyntaxOnly` prohíbe las *parameter properties* de TypeScript.** El
> tsconfig de este repo (plantilla de Vite) la trae activada, y el `constructor(message,
> public statusCode, public data)` de `ApiError` en `http.ts` **no compila**. Se
> reescribió con campos declarados a mano. Fue el **único** archivo copiado que dio error
> de tipos. Si más adelante algo copiado usa `enum`, chocará con lo mismo.

> ✅ **CORS ya no es un riesgo.** Se comprobó con `curl` contra
> `hackaton.api.alata-ec.com`: responde `access-control-allow-origin: *` y refleja los
> headers pedidos, incluido `authorization`. O sea que el backend acepta al navegador
> desde `localhost` y aceptará el dominio de Vercel **sin tocar Python**. Esto tacha uno
> de los dos avisos de la Fase 8.

Detalles menores que costaron un typecheck: apareció un `marketApi.ts` que no estaba en el
inventario original (se copió igual), `getTasas()` devuelve un `CatalogoTasas` (objeto con
`.tasas`, no un array) y el campo de `Pregunta` es `text`, no `texto`.

**Estado real:** los 21 endpoints (`/api/auth/login`, `/api/investor/profile`,
`/api/investor/{id}/portfolio`, `/api/advisor/queue`, `/api/agent/chat`…) están portados.
`src/App.tsx` es hoy una prueba de humo que llama a dos de ellos: `/api/investor/questions`
(público → trae las preguntas) y `/api/catalog/rates` (exige token → devuelve el `detail` de
FastAPI, lo que demuestra que el parseo de errores de `ApiError` sobrevivió al port).

---

## Fase 4 — Navegación: React Navigation → React Router ✅ (hecha en ~1,5 h)

Era el único cambio *arquitectónico* del port. En RN, `RootNavigator.tsx` montaba un árbol
distinto según el rol y las pantallas navegaban con `navigation.navigate('Propuesta')`,
leyendo params con `route.params`.

**Lo que quedó** (React Router 7, `createBrowserRouter`):

| Archivo | Qué es |
|---|---|
| [`src/routes/rutas.tsx`](./src/routes/rutas.tsx) | Las 14 rutas. Reemplaza a `types/navigation.ts`. |
| [`src/routes/RutaProtegida.tsx`](./src/routes/RutaProtegida.tsx) | El guard por rol. Reemplaza al `if (role === 'advisor')` de `RootNavigator`. |
| [`src/layouts/Shell.tsx`](./src/layouts/Shell.tsx) | Contenedor centrado `max-w-[480px]` sobre el canvas (adelanta la Fase 8). |
| [`src/layouts/LayoutSimple.tsx`](./src/layouts/LayoutSimple.tsx) | Shell sin barra: login, flujo del inversionista y **el detalle del asesor**. |
| [`src/layouts/LayoutAsesorTabs.tsx`](./src/layouts/LayoutAsesorTabs.tsx) | Las dos pestañas del asesor (cola / auditoría). |
| [`src/components/EnConstruccion.tsx`](./src/components/EnConstruccion.tsx) | Placeholder: cada una de las 13 pantallas se sustituye aquí en la Fase 7. |
| `src/app/auth/pages/LoginPage.tsx` | Login **mínimo pero real** (llama a `/api/auth/login`). Se reemplaza por el port de las 219 líneas en la Fase 7. |

> ⚠️ **`/asesor/propuesta/:id` NO cuelga de `LayoutAsesorTabs`,** y no es un descuido. En
> RN el detalle se apilaba encima de los tabs a propósito: mientras el asesor decide, la
> barra no está para que se distraiga y deje la decisión a medias. Si alguien "arregla"
> esto metiéndolo bajo las pestañas, rompe esa decisión de producto.

> 🔎 **Los params ahora son visibles y editables** (`/subcuentas/:sessionId`,
> `/asesor/propuesta/:proposalId`). No es un agujero nuevo: nunca fueron un permiso — el
> backend siempre verificó contra el token que el recurso fuera del usuario. El guard es
> **navegación, no seguridad**.

**Verificación:** login real contra `hackaton.api.alata-ec.com` con las cuentas sembradas
(`inversionista@demo.ec` / `asesor@demo.ec`, password `demo1234`, ver `seed.sql`). El
backend devuelve `role`, y el guard manda a cada uno a su árbol.

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

## Fase 5 — Primitivas ✅ (hecha en ~1 h)

**Resultado:** [`src/components/rn/index.tsx`](./src/components/rn/index.tsx) con 10
primitivas — `View`, `Text`, `ScrollView`, `Touchable` (+ alias `Pressable`),
`ActivityIndicator`, `SafeArea`, `TextInput`, `Modal` y el ayudante `abrirEnlace`
(`Linking.openURL`). Las clases base `.rn-vista` y `.rn-tactil` viven en `index.css`.

Traducciones que evitan tocar las pantallas una por una:

| React Native | Primitiva | Nota |
|---|---|---|
| `onPress` | `onPress` | se conserva el nombre |
| `onChangeText(texto)` | igual | el DOM da el evento; se desenvuelve dentro |
| `numberOfLines={2}` | igual | → `line-clamp-2` |
| `activeOpacity`, `hitSlop` | se aceptan y se ignoran | en web los cubre `:hover` |
| `keyboardType="decimal-pad"` | igual | → `inputMode="decimal"` |
| `contentContainerStyle` | `contentContainerClassName` | el ScrollView mantiene los **dos** divs |

**La claim del plan se cumplió:** portar `Boton.tsx` (36 líneas) fue cambiar el import,
`TouchableOpacity` → `Touchable` y borrar `activeOpacity`. Nada más. Ya está en
[`src/components/shared/Boton.tsx`](./src/components/shared/Boton.tsx) y se renderiza en
las pantallas placeholder.

### Dos trampas encontradas al ejecutar

> ⚠️ **Nunca construyas clases de Tailwind con plantillas.** El primer borrador usaba
> `` `line-clamp-${numberOfLines}` ``: el JIT escanea el código **como texto**, así que una
> clase que solo existe en tiempo de ejecución jamás llega al CSS. Falla en silencio — el
> recorte simplemente no ocurre. Se cambió por un mapa con las clases escritas enteras.

> ⚠️ **`TextInput` no usa `type="number"`,** aunque `keyboardType` sea numérico. `type=number`
> bloquea la coma decimal ecuatoriana con la que trabajan `montoConSeparadores` y
> `montoANumero`. Va `type="text"` + `inputMode="numeric"`: teclado numérico en móvil, coma
> permitida.

**Verificado:** `.rn-vista` compila a `display:flex; flex-direction:column; flex-shrink:0;
min-width:0; min-height:0` y —lo que de verdad importaba— las utilidades de Tailwind salen
**después** en el CSS (byte 5130 vs 3612), así que un `<View className="flex-row">` de
cualquier pantalla portada se pone en fila y no en columna.

---

### Diseño original (referencia)

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

## Fase 6 — Portar los componentes compartidos ✅ (hecha en ~1,5 h)

Los 10 quedaron en `src/components/shared/` (+ el donut en `app/inversionista/components/`).
Todos pasan `tsc -b` y transforman en Vite sin errores. Cada uno conservó **su comentario
original**, incluidos los guardarraíles de producto (ver abajo).

Íconos: Ionicons → `react-icons/io5`, conversión mecánica —
`arrow-back`→`IoArrowBack`, `sparkles`→`IoSparkles`, `information-circle`→`IoInformationCircle`,
`chevron-down/up`→`IoChevronDown/Up`, `lock-closed-outline`→`IoLockClosedOutline`,
`add-circle-outline`→`IoAddCircleOutline`. En web el ícono JSX no puede ir *inline* dentro
de un `<Text>` como en RN, así que en `DisclaimerBanner` se envolvió en un `View` hermano.

> ⚠️ **Guardarraíles preservados a conciencia** (criterio #3 del track, antialucinación):
> `DisclaimerBanner` sigue **sin** botón de cerrar; el pie con fuente+fecha de
> `Calificacion` sigue siendo **inseparable** del rating; `ExplicacionIA` sigue mostrando
> el texto del LLM **literal**, sin parafrasear. Un port descuidado los borra sin notarlo.

**Donut (`DonutPortafolio`, el único con SVG):** `react-native-svg` → SVG del DOM. Cambios
reales: `<Svg>/<Circle>/<G>` → `<svg>/<circle>/<g>`, y `<G rotation originX originY>` →
`<g transform="rotate(-90 cx cy)">`. Verificado renderizándolo con `react-dom/server`: React
convierte `strokeDasharray` → `stroke-dasharray` (kebab), pinta los 3 arcos y aplica el
`rotate(-90)`. El SVG es correcto.

> 🔎 **Vitrina temporal:** `src/_vitrina.tsx` en la ruta `/vitrina` (fuera del guard)
> renderiza los 10 con datos falsos para revisarlos con el ojo. **Se borra al empezar la
> Fase 7**, junto con su ruta lazy en `rutas.tsx`.

### Diseño original (referencia)

Orden de port (las pantallas los consumen):

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

## Fase 7 — Portar las pantallas ✅ (hecha)

Las 15 pantallas + el subsistema del agente, portadas. La app web es autónoma: **cero
imports de `react-native`, `expo` o `@react-navigation` en `src`** (verificado por grep) y
el bundle no arrastra RN. `npm run build` pasa limpio (tsc + vite).

**Piezas nuevas que la app había ganado desde el inventario original** y que también se
portaron: la ruta `/mercados` (`MercadosSimuladorPage` + `LineChart` SVG), `MarketTicker`,
`RecomendacionIA`, `FormularioPreguntas`, `BarraCapital`, `TarjetaSubcuenta`, `HomeHeader`.

**Infra del port** (lo que hizo que cada pantalla fuera casi copiar-pegar):
- [`src/components/Icono.tsx`](./src/components/Icono.tsx) — `Ionicons` sobre `react-icons/io5`.
  Cambiar el import `@expo/vector-icons` → `@/components/Icono` y el JSX no se toca.
- [`src/routes/navegacion.ts`](./src/routes/navegacion.ts) — shim de React Navigation:
  `useNavigation`, `useRoute`, `useFocusEffect` traducidos a React Router. Las pantallas
  siguen escribiendo `navigation.navigate('Propuesta', params)`.

**Adaptaciones web conscientes:**
- `RefreshControl` (pull-to-refresh) → botón "Actualizar" (Cola) o se cae (Auditoría).
- `Modal` de RN → overlay `fixed` (AgentSheet, EventoAuditoriaModal).
- `Animated` (typing dots) → animación CSS `.punto-typing`.
- `LineChart`/`DonutPortafolio` `react-native-svg` → SVG del DOM; el LineChart usa `viewBox`
  + `width:100%` en vez de medir con `onLayout`.
- `AgenteFab` se ancla con `position: fixed` dentro del ancho de la app, no a la esquina.
- `HomePage`/`HomeBody` NO se portaron: son código muerto (nadie los importa; el router usa
  `InicioPage`).

> ⚠️ **`useFocusEffect` en web ≈ montaje.** El shim lo implementa como `useEffect(fn, [])`.
> Funciona porque React Router desmonta la ruta al salir y la re-monta al volver, que es
> justo cuando las pantallas quieren recargar. Si algún día dos rutas comparten componente
> sin desmontar, habría que revisarlo.

### Diseño original (referencia)

Orden de port (fue el de la demo, con línea de corte):

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

Dos cosas más, y son las dos que se olvidan siempre:

- ⚠️ **`VITE_API_BASE_URL` hay que crearla a mano en el dashboard de Vercel.** Ningún `.env*`
  se versiona (ver Fase 1), así que el build de Vercel no la hereda del repo.
- ✅ **CORS: ya verificado en la Fase 3, no hay nada que hacer.** El backend responde
  `access-control-allow-origin: *` y refleja `authorization` en el preflight. No hay que
  tocar Python.

---

## Presupuesto y realidad

| Fase | Estimado | Real |
|---|---|---|
| 1 · Andamiaje | 0,5 h | ✅ ~0,4 h |
| 2 · Colores | 0,25 h | ✅ ~0,25 h |
| 3 · TS puro + servicios | 0,5 h | ✅ ~0,5 h |
| 4 · Router | 2 h | ✅ ~1,5 h |
| 5 · Primitivas | 1 h | ✅ ~1 h |
| 6 · Compartidos | 2 h | ✅ ~1,5 h |
| 7 · Pantallas | 12–16 h | ⬜ |
| 8 · Shell + deploy | 1 h | ⬜ |
| **Restante** | **≈19–23 h** | |

Las dos fases hechas salieron en tiempo. Eso **no** es evidencia de que la Fase 7 vaya a
salir en tiempo: 1 y 2 son configuración, la 7 son 6.163 líneas.

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
