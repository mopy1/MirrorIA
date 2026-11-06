# 🪞 mirroria-frontend (web de MirrorIA) — Arquitectura, Árbol Real y Lógica por Feature

Este documento define la arquitectura técnica, los patrones de diseño y la estructura de
carpetas de `mirroria-frontend`. Es la fuente de verdad exclusiva del frontend web — el
`AGENTS.md` de la raíz del repo (`../AGENTS.md`) solo enlaza para acá. La arquitectura y las
reglas son una adaptación directa de `sw-case/case-frontend/AGENTS.md` (mismo patrón y mismo
criterio de cuándo aplicar cada regla), llevada al dominio del proyecto: **MirrorIA**, una plataforma SaaS multi-tenant
de tiendas de moda femenina multi-sucursal, donde **Tiendaria es una tienda más** (`/t/tiendaria`). Si sos una IA nueva,
leé antes `../HANDOFF.md` y `../AGENTS.md`.

Cualquier agente IA o desarrollador que trabaje en esta base de código **DEBE** seguir estas
directrices de forma obligatoria.

> **Actualizado: 2026-11-06 (Fase 6 Interactivad Total en Dashboard & ML Gerencial Humanizado)**.
> Las secciones 2 y 3 describen lo que existe hoy en `src/`, verificado contra `src/App.tsx`, `src/routes/rutas-app.ts`,
> `src/features/*` y `src/layouts/site-header/*`. Tests: **198** en 34 suites (`npx vitest run`).
> - Dashboard: filtros 100% interactivos por período (`hoy`, `7d`, `30d`, `mes_actual`, `mes_anterior`, `personalizado` con selector de fechas) y por sucursal (`SelectorSucursal`).
> - ML: experiencia gerencial con textos comprensibles (sin lenguaje crudo de desarrollador en anomalías POS), controles de horizonte temporal y sucursal interactivos, y Validación Académica trasladada a una Ficha Técnica modal y secundaria sin estorbar la operativa diaria.

---

## 🧰 0. Stack y herramientas

- **Framework:** Vite + React 19 + TypeScript (~6.0) + Tailwind v4 (vía `@tailwindcss/vite`,
  sin `tailwind.config.js`). `react-router-dom` 7 (`BrowserRouter` en `App.tsx`);
  `AuthProvider` envuelve `<App />` en `main.tsx`; `CartProvider` y `TenantProvider` viven en `TiendaRoot` (`/t/:slug`).
- **UI: shadcn/ui**, preset **Nova** sobre **Base UI** (no Radix). Primitivas instaladas en
  `src/components/ui/`: accordion, alert, aspect-ratio, avatar, badge, button, card, chart,
  dialog, dropdown-menu, field, input, label, navigation-menu, radio-group, select, separator, sheet,
  skeleton, switch, table, tabs, textarea, toggle, toggle-group, tooltip. `cn` viene del paquete npm `cn` (`import { cn } from "cn"`) — **no** existe
  `lib/utils.ts`, no crearlo.
- **Identidad visual (Fase 1b):** dos mundos que no se mezclan.
  **MirrorIA** (la plataforma) = `:root`/`.dark` de `src/index.css`: índigo `oklch(0.33 0.17 277)`
  (`#281B89`) + acento lima `--brand-accent` (`#C3F74C`, solo como relleno, nunca texto sobre claro);
  oscuro compuesto aparte (noche índigo, primario lima). Títulos en Bricolage Grotesque
  (`--heading-font`, `h1-h3` y la utilidad `font-heading`), cuerpo Geist. Wordmark/isotipo en
  `components/marca/plataforma-logo.tsx` (`mırrorIA` con el punto de la "i" en lima; isotipo = "m" de tres patas + punto lima), favicon = isotipo. **Cada tienda** pinta su marca encima:
  neutros de croma 0 en `[data-tema="tienda"]` (+ `.dark`) y sus colores como variables inline en
  `<html>` (`lib/tema/`). `--accent` sigue siendo el hover de shadcn; el acento de marca es
  `bg-brand-accent text-brand-accent-foreground`. Fuentes de tienda (Outfit, DM Sans, Playfair)
  se cargan con `import()` dinámico (`lib/tema/fuentes.ts`). `--radius: 0.75rem` en MirrorIA. Iconos **100% Phosphor** (`@phosphor-icons/react`), también en los
  primitivos de shadcn (`dialog`/`sheet` → `X`, `select` → `CaretDown`/`CaretUp`/`Check`,
  `navigation-menu` → `CaretDown`; el isotipo de la tienda Tiendaria usa el path de `Sparkle`). `lucide-react` desinstalado
  (2026-11-04) y `components.json` con `"iconLibrary": "phosphor"`, así `shadcn add` genera los
  componentes nuevos con Phosphor; si alguno llega con un import de lucide, cambiarlo a mano. Animación con `motion` (`motion/react`).
**Modo oscuro (decisión confirmada por el usuario, 2026-11-05):**
1. **MirrorIA** (landing, alta, `/entrar`, `/plataforma/*`, Wayra) sigue el `prefers-color-scheme` del sistema del visitante (hook `hooks/useTemaPlataforma.ts`), sin botón.
2. **Cada tienda** tiene un modo **fijo de marca** `CLARO` u `OSCURO` (`inquilino_marca.modo`) que elige la dueña en `/admin/apariencia` (desde el plan Crecimiento; el nivel `ESENCIAL` del Básico no lo permite) e **ignora** el modo del sistema del visitante: `lib/tema/aplicar-tema.ts` pone `.dark` en `<html>` solo si la marca es `OSCURO` (y solo en la vitrina `/t/:slug`; el `/admin` de la tienda queda claro). Al pasar a oscuro se revalida el contraste del color principal contra el fondo oscuro `#0A0A0A` (≥ 4.5:1, botón "Ajustar contraste"; el backend responde 400 si no cumple).
3. **No existe** interruptor de modo para el visitante en las tiendas **ni** un modo "Automático": decisión del usuario, no agregarlo sin que lo pida.
Ejemplos: `nomada` es OSCURO; `tiendaria` y `casa-andina` son CLARO.

- **Otras dependencias:** React Hook Form + Zod (`@hookform/resolvers`), Recharts (reportes),
  `@decartai/sdk` (probador virtual).
- **Alias `@/*` → `src/*`:** en `vite.config.ts`, `tsconfig.app.json` **y** en el
  `tsconfig.json` raíz (este último es necesario para que `shadcn add` no escriba en una
  carpeta literal `./@/`).
- **Cliente HTTP (multi-tenant, Fase 1):** `fetch` nativo envuelto en `lib/api.ts` (`apiFetch(path,
  options, modo)`, `ApiError`). `cabecerasTenant(modo)`: manda **`X-Tenant: <slug>`** = tienda navegada
  (`lib/tienda-activa.ts`, la fija `TenantProvider` en `/t/:slug`) o, si no hay, el `tenant.slug` de la
  sesión; el `Authorization: Bearer` solo si no hay tienda activa o la sesión es de ESA tienda (sesión
  ajena = invitada, nunca 403). Modos: `auto` (default), `sesion` (`/auth/me`), `ninguno` (`/saas/*`
  públicas, ciudades del alta, login de plataforma). Une `message[]` del backend; ante un `401`
  (salvo `/seguridad/auth/*`) limpia la sesión y va a `destinoTras401`: `/t/<tienda>/login`,
  `/plataforma/login` o `/entrar`. Un 403 "no está disponible" emite `mirroria:tienda-no-disponible`.
- **Variables de entorno:** solo `VITE_API_URL` (build-time). Sin definir cae en
  `http://localhost:3000/api/v1`. El `Dockerfile` la fija en `/api/v1` (mismo origen vía Nginx).
- **Puerto de desarrollo: `5174`** (fijo en `vite.config.ts`) — coincide con `CORS_ORIGINS` de
  `mirroria-backend/.env.example`; si se cambia acá, cambiarlo también ahí.
- **Scripts:** `npm run dev`, `npm test` (vitest), `npm run lint` (oxlint),
  `npm run build` (`tsc -b && vite build`, pesado en RAM — para chequear tipos alcanza
  `npx tsc -b --noEmit`).
- **Docker:** `Dockerfile` multi-stage (node:24-alpine build → nginx:alpine). `ARG NGINX_CONF`:
  `nginx.conf` (default, HTTP plano en `:80`, `server_name _`, proxy `/api/` →
  `mirroria-backend:3000`) o `nginx.prod.conf` (dominio + Let's Encrypt, solo con
  `docker-compose.prod.yml`). Contenedor `mirroria_frontend`. Ambas confs tienen `gzip on`
  (js/css/json/svg, `gzip_min_length 1024`) y `location ^~ /assets/` con `expires 1y` +
  `Cache-Control "public, immutable"` (los nombres de Vite llevan hash); el `^~` hace falta para
  ganarle a la location regex de estáticos (`try_files $uri =404`).

---

## 🏛️ 1. Principios Arquitectónicos Fundamentales

Idénticos a `case-frontend`.

### A. Arquitectura Orientada a Features (Bulletproof React)
Se organiza por **dominios de negocio** en `src/features/`, no por tipo técnico. Cada feature
encapsula sus propios `api/`, `types/`, `components/`, `hooks/`, `lib/` y `pages/`.

### B. Regla Estricta "Anti-1k-Lines" (Archivos pequeños y legibles)
**Ningún archivo debe superar las 100-150 líneas de código.**
1. **Thin Pages (< 30 líneas):** las páginas en `pages/` solo orquestan. Cero lógica de
   negocio, cero peticiones directas (ej. `PagoPage` decide qué componente mostrar y nada más;
   `ProbadorPage` solo renderiza lo que devuelve `useProbador`).
2. **Separación de Lógica y Presentación (Custom Hooks):** validación, HTTP, loading y errores
   viven en hooks, no en el JSX.
3. **Data-Driven UI (`*.data.ts`):** textos largos, configuraciones y listas de opciones se
   extraen a un `*.data.ts` cuando aplica el criterio C. Las rutas también son
   data-driven: `TIENDA_ROUTES`, `ADMIN_ROUTES`, `STAFF_ROUTES` y `LEGACY_PATHS` en `routes/rutas-app.ts`.

### C. Patrón de Carpeta por Componente (solo cuando se justifica)
Carpeta con `index.ts` (+ `.data.ts` opcional) **solo** si el componente se reutiliza en 2+
lugares, supera ~80 líneas de JSX o tiene una lista de configuración que conviene separar. Para
componentes chicos de un solo uso, un único `.tsx` alcanza (ej. `features/payments/components/`,
`features/wayra/components/`, `features/fitting/components/` son archivos sueltos).

```text
nombre-componente/
├── nombre-componente.tsx       # JSX (< 80 líneas)
├── nombre-componente.data.ts   # textos/opciones estáticas (solo si aplica C)
└── index.ts                    # export * from './nombre-componente'
```

### D. Componentes UI Primitivos (shadcn)
`src/components/ui/` es exclusiva para primitivas instaladas vía shadcn. **Prohibido** meter
lógica de negocio o llamadas a la API ahí.

### E. Hooks: Locales vs Globales (Regla de Promoción)
- **Locales (`features/<modulo>/hooks/`):** si solo los usa un módulo.
- **Globales (`src/hooks/`):** utilidades agnósticas o hooks que usan 2+ módulos (`useAuth`,
  `useCart`, `useResourceList`, `useCreateResource`).

### F. Lógica pura en `lib/` con tests
Reglas de negocio sin React (ventana de reserva, código de reserva, pasos del probador, prompt
de la prenda, columnas del showcase) viven en `features/<modulo>/lib/*.ts` con su
`*.test.ts` de vitest al lado.

---

## 🗺️ 2. Rutas (`src/App.tsx` + tablas en `routes/rutas-app.ts`) — Fase 1 SaaS

| Ruta | Página | Guard / Layout |
|---|---|---|
| `/` | `saas/LandingPage` (hero, cómo funciona, planes, directorio `#tiendas`, CTA) | `SaasLayout` |
| `/planes` | `saas/PlanesPage` (tarjetas + comparativa) | `SaasLayout` |
| `/registro-tienda` (`?plan=`) | `saas/RegistroTiendaPage` (asistente 3 pasos → `POST /saas/tiendas` → login → `/admin/catalogo`) | `GuestRoute` + `SaasLayout` |
| `/entrar` | `saas/EntrarPage` (slug → `/t/:slug/login`) | `SaasLayout` |
| `*` | `errors/NotFoundPage` (versión SaaS: "Crear mi tienda") | `SaasLayout` |
| `/t/:slug` (index) | `catalog/HomePage` | `TiendaRoot` (TenantProvider + CartProvider) + `TiendaLayout` |
| `/t/:slug/tienda`, `/tienda/producto/:id`, `/sucursales`, `/probador[/:productoId]` | las de siempre | público |
| `/t/:slug/carrito`, `/checkout`, `/pago/:ventaId`, `/pago/exito`, `/pago/cancelado`, `/mis-pedidos`, `/reservas` | las de siempre | `ProtectedRoute` (sesión de ESTA tienda) |
| `/t/:slug/login`, `/t/:slug/registro` | `auth/LoginPage`, `RegisterPage` | `GuestRoute` por tienda (`AuthLayout` con nombre de tienda) |
| `/t/:slug/*` | `NotFoundPage` (versión tienda) | `TiendaLayout` |
| rutas viejas `/tienda/*`, `/sucursales`, `/carrito`, `/checkout`, `/pago/*`, `/mis-pedidos`, `/reservas`, `/probador/*`, `/login`, `/register` | `routes/LegacyRedirect` → `/t/<sesión o tiendaria>/…` (+ query; `/register`→`/registro`) | — |
| `/wayra/pagar/:token` | `wayra/WayraPagoPage` | público, global, sin layout |
| `/admin` (padre con `<Outlet/>`) | → `/admin/catalogo` | `StaffRoute` (staff + `user.tenant`) + `AdminLayout` |
| `/admin/catalogo`, `/proveedores`, `/sucursales`, `/cupones`, `/usuarios`, **`/suscripcion`** | `admin/*AdminPage`, `subscription/SuscripcionAdminPage` | `AdminRoute` (ADMIN + tenant) |
| **`/admin/apariencia`**, **`/admin/suscripcion/activar`** (Fase 1b) | `appearance/AparienciaAdminPage`, `subscription/ActivarPlanPage` | `AdminRoute` |
| `/admin/inventario`, `/ventas` (ADMIN, ENCARGADO) · `/reservas` (+CAJERO) · `/cobros` (ADMIN, CAJERO) · `/reportes` | `admin/*AdminPage` | `StaffRoute` |
| `/plataforma/login` | `auth/PlataformaLoginPage` (`LoginForm modo="plataforma"`) | `GuestRoute` |
| `/plataforma` → **`/plataforma/resumen`** (dashboard, 1b), `/inquilinos` (`?q&estado&suscripcion&plan&orden`), `/inquilinos/:id`, `/planes`, `/ciudades` | `platform/*Page` | `PlataformaRoute` (DUENO_PLATAFORMA) + `PlataformaLayout` |

Guardas sin sesión: `ProtectedRoute` → `/t/:slug/login`; `AdminRoute`/`StaffRoute` → `/entrar`;
`PlataformaRoute` → `/plataforma/login`. Con rol equivocado → `destinoTrasLogin(user)` (`lib/destino-sesion.ts`:
plataforma → `/plataforma/resumen`, ADMIN → `/admin`, CAJERO → `/admin/cobros`, ENCARGADO → `/admin/reportes`, CUSTOMER → `/t/<slug>`).

**Helper de rutas:** `hooks/useRutaTienda.ts` → `ruta("/carrito")` = `/t/<slug>/carrito` (puro en
`lib/rutas-tienda.ts` `rutaTienda`/`rutaLegacy`, con test). TODOS los links de la tienda pasan por `ruta()`
(header, footer, hero, cards, pagos, checkout, probador, auth). `hooks/useTienda.ts` (`{ tienda, slug }`, null fuera
de `/t/:slug`), `hooks/useSesionEnTienda.ts` (usuario solo si su `tenant.slug` es el de la tienda).

**Carga diferida:** las páginas `/admin/*`, `ProbadorPage` y `WayraPagoPage` se importan con
`React.lazy` desde `routes/lazy-pages.ts` (un `<Suspense>` con `components/common/PageFallback`
envuelve `<Routes>`); las de la tienda pública siguen estáticas. Bundle inicial: 1.57 MB →
795 kB (gzip 457 → 241 kB). Una página nueva de admin se agrega ahí, no como import estático.
Fase 1b: también `/planes`, `/registro-tienda` y `/plataforma/login` van diferidas (auditoría 1b: 903 → 861 kB);
la landing `/` sigue estática. Nginx sirve `index.html` con `Cache-Control: no-cache` (si el navegador lo
cacheaba, tras un despliegue pedía chunks con hash viejo → 404 → página en blanco).

**Navegación (sin páginas huérfanas):**
- SaaS (MirrorIA): navbar (`layouts/saas-header/`) Planes · Tiendas · Preguntas (anclas de `/`) · Entrar/Ir a mi
  panel (ghost) · **Crear mi tienda** (único primario); footer Producto (Planes, Comparar planes, Tiendas,
  Preguntas) · Cuenta (Entrar, Crear mi tienda, Tienda demo, Acceso plataforma).
- Tienda: `components/marca/logo-tienda-actual.tsx` (su logo o monograma + nombre, nunca el wordmark de
  MirrorIA); subrayado del ítem activo y contador del carrito con `bg-brand-accent`; footer con eslogan,
  "sobre nosotras", redes cargadas e `InsigniaPlataforma` ("Hecho con MirrorIA" → `/`, se quita con Cadena).
- Admin: grupo **"Mi tienda"** (`admin-sidebar.data.ts`): Ver mi tienda · **Apariencia** (ADMIN) · Plan y
  suscripción (ADMIN, badge de días en TRIAL); cabecera con el logo/monograma de la tienda y plan; pie
  "Funciona con MirrorIA". `layouts/useTemaAdmin.ts` aplica el tema parcial y escucha
  `mirroria:marca-actualizada` (lo emite Apariencia al guardar). `admin-avisos.tsx`: verde de bienvenida
  (link "Cargar mi primera prenda"; el alta cae en `/admin/apariencia`), ámbar ≤ 3 días y rojo con "Activar plan".
- Plataforma: `layouts/plataforma-sidebar.tsx` Resumen · Tiendas · Planes · Ciudades · Cerrar sesión; filas
  con "Gestionar" + menú ⋯ (Ver tienda, Copiar enlace) y detalle con "← Volver a tiendas".
- Header de tienda (`layouts/site-header/`): Tienda, Sucursales, menú de Categorías (en vivo desde
  `useCategorias`), buscador, carrito con badge. `header-auth.tsx`: sin sesión → login/registro;
  con sesión → "Mis pedidos", "Mis reservas" + link de staff por rol (`ADMIN` → `/admin`, `CAJERO` →
  `/admin/cobros`, `ENCARGADO_SUCURSAL` → `/admin/reportes`, porque `/admin` redirige a una ruta
  solo ADMIN).
- Footer de tienda (`site-footer.data.ts`, paths relativos que `ruta()` convierte a `/t/<slug>/…`): Catálogo,
  Vestidor virtual (probador), Sucursales, Reservas, Contacto (`#contacto`). Sin columna Legal.
- Hero y feature-highlights enlazan a `ruta("/tienda")` y `ruta("/probador")`; la ficha enlaza a `ruta("/probador/:id")`.
- Sidebar admin (`admin-sidebar-content.tsx`): filtra ítems por `roles` (mismos del router) y
  oculta los grupos vacíos.
- `/wayra/pagar/:token` no tiene link interno a propósito: se llega escaneando el QR.

---

## 🌲 3. Árbol real de `mirroria-frontend` y lógica por feature

```text
mirroria-frontend/
├── public/
│   ├── favicon.svg                    # isotipo de MirrorIA
│   ├── manifest.webmanifest           # manifiesto PWA (start_url "/", theme_color "#281b89", standalone)
│   ├── sw.js                          # Service Worker liviano (App Shell Cache-First, fallback /index.html SPA)
│   └── images/hero-model.webp, images/marcas/tiendaria.svg   # hero de Tiendaria · isotipo de la tienda Tiendaria
├── src/
│   ├── main.tsx                       # AuthProvider > App, registro no bloqueante de Service Worker
│   ├── App.tsx                        # árbol de rutas (§2) + ModalConflictoStock global
│   ├── index.css                      # tokens MirrorIA (:root/.dark índigo + lima) y neutros de tienda [data-tema="tienda"], Tailwind v4
│   ├── components/
│   │   ├── ui/                        # primitivas shadcn (Base UI), sin lógica de negocio
│   │   ├── marca/                     # logos (MirrorIA, de tienda, monograma), insignia, selector de paleta, galería, vista-previa/
│   │   └── common/                    # SearchInput, PageFallback, ProductImagePlaceholder, EstadoBadge, UsoPlanMeters,
│   │                                  # HistorialSuscripcion, ErrorConPlan, EstadoConexionBadge, ListaOutboxSheet, ModalConflictoStock
│   ├── context/                       # AuthContext (+auth-context), CartContext (+cart-context), TenantContext (+tenant-context, cargando-tienda)
│   ├── hooks/                         # globales: useAuth, useCart, useResourceList, useCreateResource, useRecurso,
│   │                                  # useTienda, useRutaTienda, useSesionEnTienda, useMarca, useTemaPlataforma
│   ├── layouts/
│   │   ├── SaasLayout.tsx + saas-header/ + saas-footer/     # MirrorIA pública
│   │   ├── TiendaLayout.tsx (TiendaRoot, TiendaLayout) → StorefrontLayout.tsx + site-header/ (con EstadoConexionBadge) + site-footer/
│   │   ├── AuthLayout.tsx             # split-screen de login/registro ("← Volver a <tienda>")
│   │   ├── AdminLayout.tsx + admin-sidebar-{content,header,nav,footer}.tsx + admin-sidebar.data.ts + admin-avisos.tsx + useTemaAdmin.ts (con EstadoConexionBadge)
│   │   └── PlataformaLayout.tsx + plataforma-sidebar.tsx
│   ├── lib/                           # api.ts (apiFetch, ApiError, Idempotency-Key automática, X-Tenant), tienda-activa.ts,
│   │                                  # rutas-tienda.ts, destino-sesion.ts, money.ts, fechas.ts, limites-plan.ts,
│   │                                  # offline/ (idb.types.ts, idb.ts, outbox-manager.ts, use-outbox.ts, spec tests),
│   │                                  # tema/ (color, derivar-tokens, aplicar-tema, fuentes, marca.constants, eventos)
│   ├── routes/                        # ProtectedRoute, GuestRoute, AdminRoute, StaffRoute, PlataformaRoute, LegacyRedirect,
│   │                                  # rutas-app.ts (tablas de rutas), lazy-pages.ts (React.lazy)
│   ├── types/                         # plan.types, tienda.types, marca.types (compartidos entre features)
│   └── features/                      # 19 features, ver detalle abajo:
│                                      # admin appearance auth branches cart catalog checkout errors fitting inventory orders
│                                      # payments platform promotions providers reports reservations saas subscription wayra
├── Dockerfile, nginx.conf, nginx.prod.conf
├── components.json                    # shadcn (preset Nova, Base UI, iconLibrary phosphor)
├── vite.config.ts                     # alias @, puerto 5174
└── tsconfig.json / tsconfig.app.json / tsconfig.node.json
```

### `features/saas/` ↔ backend `saas` (landing pública, Fase 1)
- `api/saasApi.ts` (todas en modo `ninguno`): `getPlanes`, `getTiendas`, `getDisponibilidad`, `resolverTienda`,
  `registrarTienda`, `getCiudades`. `types/saas.types.ts` (`DisponibilidadSlugDto`, `RegistrarTiendaDto`,
  `RegistroTiendaResponse`; reexporta los compartidos de `src/types/plan.types.ts` y `tienda.types.ts`).
- `lib/planes.ts` (`PLAN_DESTACADO`, `INCLUIDO_EN_TODOS`), `lib/slug.ts` (+test: `REGEX_SLUG`, reservados,
  `slugDesdeNombre`, `errorDeSlug`).
- `hooks/`: `usePlanes`, `useTiendasDirectorio`, `useCiudades`, `useDisponibilidadSlug` (debounce 400 ms),
  `useRegistroTiendaForm` (estado y validación por paso), `useRegistrarTienda` (guarda la bienvenida en
  `sessionStorage` con `lib/bienvenida.ts`, login y `/admin/catalogo`; antes iba en `state` del router y se
  perdía porque `GuestRoute` redirige a `/admin` al loguear).
- `components/`: `landing-hero/`, `como-funciona/`, `planes-grid/` (`plan-card`, `planes-grid` 4 estados,
  `comparativa-limites`, `seccion-planes`), `tiendas-directorio/` (empty "Sé la primera"), `landing-cta/`,
  `registro-tienda/` (`asistente-registro`, `stepper`, `paso-plan`, `paso-tienda`, `slug-input`, `ciudad-select`,
  `campo-texto`, `paso-cuenta`, `resumen-registro`).
- `pages/`: `LandingPage`, `PlanesPage`, `RegistroTiendaPage`, `EntrarPage`, `TiendaNoDisponiblePage`.

### `features/subscription/` ↔ `GET/PATCH /saas/mi-suscripcion` + cobros SaaS (Fase 2)
`api/suscripcionApi.ts` (`getMiSuscripcion`, `cambiarPlan`, `getPlanes`, `iniciarCobro`, `estadoCobro`, `simularPago`),
`types/suscripcion.types.ts` (`MiSuscripcionDto`, `IniciarCobroSuscripcionDto`, `CobroSuscripcionResponseDto`, `EstadoCobroSuscripcionResponseDto`),
hooks: `useMiSuscripcion.ts`, `useCambiarPlan.ts`, `useCobroSuscripcion.ts`, `useEstadoCobroSuscripcion.ts` (polling 2.5s y simulación dev).
Componentes: `plan-actual-card`, `cambiar-plan-dialog`, `pagar-suscripcion-cta`, `pasarelas-suscripcion.tsx` (orquestador dinámico),
`pasarela-item.tsx` (fila con badge semántico), `cobro-qr-dialog.tsx` (modal Base UI), `cobro-qr-contenido.tsx` (QR + Bs. + polling + simular pago dev).
Páginas: `SuscripcionAdminPage.tsx` (alerta de éxito ante `?pago=exito`), `ActivarPlanPage.tsx` (flujo Wayra QR y Stripe Tarjeta).

### `features/platform/` ↔ `/saas/plataforma/*` + ciudades (DUENO_PLATAFORMA)
`api/plataformaApi.ts`, `types/plataforma.types.ts`, `lib/plan-form.ts` (+test), hooks (`useResumenPlataforma`,
`useInquilinos`, `useInquilino` sobre `hooks/useRecurso.ts`; `useFiltrosInquilinos` (filtros en la query string);
`useAccionesInquilino`; `usePlanesPlataforma`; `useCiudadesPlataforma`; `useDashboard`; `useMetricasTienda`), components
(`inquilinos-filtros`, `inquilinos-table` + `inquilino-row`, `inquilino-cabecera`, `accion-dialog` +
`suspender-`/`extender-`/`cambiar-plan-inquilino-dialog`, `planes-table`, `plan-form-dialog` + `plan-form-fields`,
`ciudades-table`, `ciudad-form-dialog`, más los de la Fase 1b abajo), **5 páginas** (`PlataformaDashboardPage`,
`PlataformaInquilinosPage`, `PlataformaInquilinoDetallePage`, `PlataformaPlanesPage`, `PlataformaCiudadesPage`). Solo
conteos y agregados de cada tienda, nunca filas de negocio.

### Fase 1b (2026-11-05): tema por tienda, Apariencia y panel de plataforma
- **`lib/tema/`** (puro, con tests): `color.ts` (hex↔OKLCH, contraste WCAG, `textoSobre` blanco/negro,
  `validarPrincipal`, `ajustarContraste` baja/sube L de a 0.02), `derivar-tokens.ts` (`derivarTokens(marca,
  'tienda'|'admin')`, `VARS_TEMA`), `aplicar-tema.ts` (`aplicarTemaTienda`, `limpiarTema`,
  `prepararNeutrosTienda`, caché `mirroria.marca.<slug>`), `fuentes.ts`, `marca.constants.ts` (FUENTES,
  RADIOS, DESTINOS, PALETAS con portada, NIVELES, `marcaPorDefecto`, `marcaDe`), `eventos.ts`.
- **Quién aplica el tema:** `context/TenantContext.tsx` (layout effect: neutros + caché antes del paint;
  tras `resolverTienda`, fuente ≤ 300 ms y marca; inexistente/caída → MirrorIA; desmontar → limpiar),
  `layouts/useTemaAdmin.ts` (admin), `hooks/useTemaPlataforma.ts` (SaasLayout, PlataformaLayout,
  login de plataforma, Wayra). `hooks/useMarca.ts` = marca de la tienda navegada.
- **`components/marca/`** (compartidos por saas, appearance, platform y la tienda): `plataforma-logo`,
  `logo-tienda`, `logo-tienda-actual`, `monograma` (+`iniciales.ts`), `imagen-marca` (`<img>` con
  `no-referrer`, lazy y respaldo), `insignia-plataforma`, `selector-paleta`, `galeria-imagenes.data.ts`
  (24 fotos verificadas) y `vista-previa/` (`VistaPreviaTienda`: mini tienda con el tema en SU contenedor,
  escalada desde 1280/390 px por `MarcoDispositivo`; sin portales ni variantes `dark:`).
- **`features/appearance/`** (`/admin/apariencia`): `api/aparienciaApi.ts` (GET/PUT `/saas/mi-marca`,
  POST `/restablecer`, prendas para la vista previa), `lib/validar-marca.ts` (+test, mismas reglas que el
  DTO) y `lib/borrador.ts` (`conBloqueos`: lo bloqueado se ve con su valor efectivo; el PUT manda lo
  guardado), hooks `useMiMarca`, `useBorradorMarca`, `useGuardarMarca`, `useBloqueoSalida`
  (beforeunload + click en links), `useProductosPreview`; componentes `editor-apariencia`,
  `apariencia-tabs` (pestañas + grid formulario/vista previa), `seccion-{marca,colores,estilo,portada,
  imagenes,textos}`, `campo-{imagen,color,texto-marca}`, `galeria-dialog`, `aviso-contraste`,
  `candado-plan`, `panel-vista-previa` (sticky / Sheet en móvil), `barra-guardado`, `restablecer-menu`.
- **`features/saas/`** (landing nueva): `landing-hero/` (+`abanico-marcas`), `cifras-vivas`,
  `demo-personalizacion/`, `como-funciona`, `incluye-bento/`, `tiendas-directorio/` (tarjeta con portada y
  franja del color de la tienda), `planes-grid/` (+`moneda-toggle`, filas de marca en la comparativa,
  `esDestacado` usa `plan.destacado`), `preguntas-frecuentes/`, `landing-cta`; hooks `useEstadisticas`,
  `useDemoMarca`, `usePrendasAbanico` (2 prendas reales por tienda del abanico, `X-Tenant` explícito);
  alta con `tienda.paleta` (`?paleta=`) y vista previa en el paso 2. Tras el alta, `GuestRoute` manda a
  `/admin/apariencia` si hay aviso de bienvenida pendiente (antes caía en `/admin/catalogo`).
- **`features/subscription/`:** `ActivarPlanPage` + `resumen-activacion` + `pasarelas-suscripcion`
  (+`.data.ts`, todas "Próximamente" hasta la Fase 2), `incluye-marca`; "Activar plan" es el primario.
- **`features/platform/`:** `PlataformaDashboardPage` (`components/dashboard/`: kpi-card/strip,
  indicadores-secundarios, grafico-altas, mrr-por-plan, trials-por-vencer, dashboard-estados),
  `components/detalle/` (detalle-tabs, tab-resumen/suscripcion/metricas, grafico-ventas-30d,
  acciones-menu), `actividad-feed`, `miniatura-tienda`, `uso-mini`, `restablecer-marca-dialog`,
  `extender-rapido`, `plan-marca-fields`; `lib/indicadores.ts` (+test) y `lib/eventos.ts`; hooks
  `useDashboard`, `useMetricasTienda`, `useFiltrosInquilinos` (filtros en la query string).
  Se borraron `resumen-kpis`, `trials-por-vencer` (viejo), `inquilino-metricas` y `useResumenPlataforma`.

### Compartidos de la Fase 1
`src/types/{tienda,plan}.types.ts`; `components/common/` `EstadoBadge` (badges semánticos de suscripción/tienda),
`UsoPlanMeters` (barras uso/límite), `HistorialSuscripcion`, `ErrorConPlan` (message del backend + "Ver mi plan"
si el 409 nombra al plan; usado en alta de sucursal/prenda, edición de prenda, rol y estado de usuarios);
`lib/limites-plan.ts`, `lib/fechas.ts`, `formatUsd` en `lib/money.ts`; `context/TenantContext.tsx` +
`tenant-context.ts`. `CartProvider` vive en `TiendaRoot`, no en `main.tsx`. `admin/ciudades-panel` es de solo
lectura (las ciudades son globales).

### `features/auth/` ↔ backend `seguridad`
`api/authApi.ts` (login con `X-Tenant` o sin tienda para plataforma, register en la tienda navegada,
me en modo `sesion`), `types/auth.types.ts` (`UsuarioRole` + `DUENO_PLATAFORMA`; `UsuarioResponse` con
`sucursalId` y `tenant`), `hooks/{useLogin,useRegister}.ts` (login → `destinoTrasLogin`; registro → `/t/:slug`),
`pages/PlataformaLoginPage.tsx`, `components/{login-form,register-form}/` (RHF + Zod, mismas validaciones que el
backend), `pages/{LoginPage,RegisterPage}.tsx`.

### `features/catalog/` ↔ backend `catalogo`
- `api/catalogApi.ts`: CRUD de productos, variantes, categorías, temporadas, colecciones,
  tallas y colores (tienda + admin). `types/catalog.types.ts`.
- `hooks/`: `useProductos` (filtro por categoría/búsqueda en el cliente), `useProducto`
  (devuelve `noEncontrado` ante 404/400: producto inexistente, inactivo o id inválido →
  `ProductDetailPage` muestra `NotFoundPage` con texto de prenda, no un error genérico),
  `useCategorias`, `useVariantesConProducto` (catálogo aplanado por variante con `coleccionId`, lo usan `cart` e
  inventario admin).
- `components/`: `hero-section/` (full-bleed, `.data.ts` + test), `feature-highlights/`,
  `category-showcase/` (foto real de una prenda por categoría en `category-card.tsx`; `columnas.ts` + test),
  `branches-strip/`, `contact-section/`, `product-card/`, `product-grid/`,
  `product-detail/` (variantes talla/color con `useSeleccionVariante.ts` — preselecciona derivando, sin
  efectos — y `variant-swatch-group`, foto en `product-image.tsx`, `estado-stock.tsx`,
  `useAgregarAlCarrito.ts` que muestra el error real del backend — ej. tope de 3 unidades —,
  link "Probármela" a `/probador/:id` y `ReservarEnTienda`).
- `pages/`: `HomePage`, `ProductListPage` (`?categoria=`, `?q=`), `ProductDetailPage`.

### `features/branches/` ↔ backend `sucursales`
`api/branchesApi.ts` (ciudades + sucursales), `hooks/useSucursales.ts`,
`components/branch-picker/` (usado en checkout y reservas; `SelectValue` con children de
lookup), `pages/BranchesPage.tsx`.

### `features/inventory/` ↔ backend `inventario`
`api/inventoryApi.ts` (disponibilidad por sucursal, ajustes), `api/purchaseOrdersApi.ts` (órdenes de compra: get, create, recibir y `cancelarOrden` → `PATCH /:id/cancelar`), `hooks/useDisponibilidad.ts`
(stock en la ficha: desde 2026-11-03 muestra lo **libre**, `cantidadDisponible - cantidadReservada`,
igual que lo que el backend deja comprar), `types/` (`inventory.types.ts`, `purchase-orders.types.ts`;
sin `usuarioId` ni en el DTO de alta ni en `OrdenCompra` — el backend usa el JWT y ya no lo devuelve — y sin `EN_TRANSITO`, que el backend nunca asigna).
- `hooks/useVariantesPorProveedor.ts`: cruza variante → `coleccionId` → `colecciones.proveedorId`
  en cliente (sin endpoint nuevo); da `delProveedor` y `proveedorDe(varianteId)`.
- `hooks/useCrearOrdenForm.ts`: estado + submit del alta; arranca desde `initialProveedorId` /
  `initialSucursalId` / `initialVarianteId` (si solo hay variante, deduce el proveedor); al cambiar
  de proveedor descarta prendas ajenas; muestra el `message` del backend (`ApiError`).
- `lib/resumen-ordenes.ts` (+ test): por proveedor, órdenes abiertas y unidades en tránsito.
- `components/ordenes-compra/`: `ordenes-compra-tab.tsx` (KPIs Total/Abiertas/Recibidas/Canceladas,
  tabla, diálogos; acepta `reloadKey`), `ordenes-compra-table.tsx` + `orden-compra-row.tsx` (fecha
  esperada parseada como fecha local; acciones "Recibir mercadería" y "Cancelar" en órdenes abiertas),
  `crear-orden-compra-dialog.tsx` (props `initial*`), `orden-cabecera-fields.tsx` (fecha `min` = hoy),
  `orden-items-selector.tsx` + `orden-items-list.tsx` (solo prendas del proveedor elegido),
  `recibir-orden-dialog.tsx`, `cancelar-orden-dialog.tsx` (confirmación), `pedir-proveedor-dialog.tsx`
  ("Pedir al proveedor" desde stock), `estado-orden-badge.tsx`.
- Integración: en `InventarioAdminPage` la pestaña "Órdenes a Proveedores" y la columna "Pedir"
  de `stock-table` (`stock-row.tsx`: botón de ícono camión con `aria-label`/`title` "Pedir al proveedor",
  `outline` con ≤ 5 u. libres y `ghost` si no) son **solo ADMIN** (el
  backend da 403 al encargado). Crear/recibir/cancelar refrescan stock y tránsito. Layout
  (QA visual 2026-11-04 a 1280 px): el panel "Ajuste manual" va debajo de la tabla y solo a la derecha
  desde `2xl` (`2xl:grid-cols-[minmax(0,1fr)_360px]`) — lado a lado no entraba y lo empujaba fuera de
  pantalla; las columnas de `stock-table` no llevan anchos fijos en %. En el estado vacío de órdenes, el
  botón "Nueva orden de compra" es `outline` (un solo primario por vista: el de la cabecera). En
  `ProveedoresAdminPage` (`components/proveedores-columns.tsx`): columna "Órdenes abiertas" y botón
  "Nueva orden" con el proveedor preelegido.

### `features/cart/` ↔ backend `ventas` (carrito)
`api/cartApi.ts` (get, addItem, updateItem, removeItem por `usuarioId`), `hooks/useCartLineItems.ts`
(enriquece `{varianteId, cantidad}` con producto/variante en el cliente y expone `updateItem`),
`components/{cart-item,cart-summary}/`, `pages/CartPage.tsx`. El estado global vive en
`context/CartContext`. Stepper de cantidad `[-]` y `[+]` en `cart-item` (1 a 3 unidades con `PATCH /ventas/carrito/:usuarioId/items/:varianteId`), con precio unitario y subtotal.

### `features/orders/` ↔ backend `ventas` ("Mis pedidos")
`api/ordersApi.ts` (`getMisPedidos` vía `GET /ventas/mias`, `getPedidoById`), `types/orders.types.ts` (`Pedido`, `PedidoItem`, `EstadoPedido`),
`components/order-status-badge.tsx` (badges semánticos de estado), `components/order-card.tsx` (tarjeta de pedido con comprobante/código, fecha, lista de prendas, desglose y botón a `/pago/:id` si está PENDIENTE),
`pages/MyOrdersPage.tsx` (ruta `/t/:slug/mis-pedidos` protegida en `TIENDA_ROUTES`, vinculada en `header-auth.tsx`).
2026-11-03: un ítem cuya variante ya no está en el catálogo o está inactiva ya no se oculta en
silencio: `CartLineItem.disponible = false` (precio 0), `cart-item` lo muestra "Ya no está
disponible" con el botón de quitar, `CartSummary bloqueado` oculta "Continuar", y `CheckoutPage`
muestra un aviso y deshabilita "Confirmar" (el backend igual responde 409). Requiere `activo` en
`useVariantesConProducto`.
2026-11-04: `components/compra-pendiente/` — si `GET /ventas/mias` (`checkoutApi.getMisVentas`)
trae ventas `PENDIENTE`, `CartPage` muestra una tarjeta por venta: "Tenés una compra pendiente de
pago" + el plazo en texto (30 min tarjeta/QR, 24 h efectivo). Sin hora exacta a propósito: el
backend no expone el vencimiento real y depende del método elegido. Con
sus prendas (nombre, talla/color, cantidad, subtotal) y el total. Botones: "Continuar pago"
(reintenta tarjeta con `paymentsApi.iniciarTarjeta`, que reutiliza la sesión de Stripe; si falla
→ `/pago/:ventaId` con `motivo`, igual que `useCheckout`) y `VolverAlCarrito` (con `onListo`
para recargar la lista, porque navegar a `/carrito` estando ahí no remonta). `useCartLineItems`
ahora también devuelve `variantes` (sin segundo fetch del catálogo).

### `features/checkout/` ↔ backend `ventas` + `pagos`
- `api/checkoutApi.ts`: `checkout(usuarioId, sucursalId, codigoCupon?)`, `getVenta`, `getVentas`.
- `hooks/useCheckout.ts`: crea la venta (vacía el carrito) y según el método:
  - `TARJETA` → `paymentsApi.iniciarTarjeta` → guarda `mirroria_pago_venta_id` en
    `sessionStorage` y redirige a Stripe; si falla (503 sin claves) navega a `/pago/:id` con
    `state.motivo`.
  - `QR` → `/pago/:id?metodo=QR`. `EFECTIVO` → `/pago/:id?metodo=EFECTIVO`.
- `components/{order-summary,cupon-input}/`, `components/selector-metodo-pago.tsx` (consumo dinámico de `usePasarelas('checkout')`), `pages/CheckoutPage.tsx` (< 100 líneas, resumen, cupón, `BranchPicker`, selector modular).

### `features/payments/` ↔ backend `pagos` (Fase 2 Pasarelas Enchufables)
- `api/pasarelasApi.ts`: `getPasarelas(contexto?: 'checkout' | 'suscripcion')` (`GET /pagos/pasarelas`).
- `lib/icono-pasarela.ts` (+test: mapeo a `CreditCard`, `QrCode`, `PaypalLogo`, `Money`), `lib/pasarelas.config.ts` (+test: `CONFIG_PASARELAS_FRONTEND` modular para activar/desactivar pasarelas al instante).
- `hooks/usePasarelas.ts`: carga catálogo filtrado según contexto y configuración modular.
- `types/pasarelas.types.ts`: `PasarelaMetadata`, `PasarelaId`, `TipoPasarela`, `EstadoPasarela`, `IconoPasarela`.
- `api/paymentsApi.ts`: `iniciarManual(ventaId, "EFECTIVO")`, `iniciarTarjeta`, `iniciarQr`
  (`POST /pagos/ventas/:id/qr`, crea o reutiliza el QR), `estadoQr` (`GET /pagos/qr/:pagoId`),
  `pendientes`, `confirmar`, `cancelar` (`POST /pagos/ventas/:id/cancelar`, 204: "volver al
  carrito").
- `types/payments.types.ts`: `MetodoPago = "TARJETA" | "QR" | "EFECTIVO"`, `CobroQr`
  (`qrImagen` PNG data URL, `qrContenido`, monto, estado), `EstadoCobroQrRespuesta`, `Pago`,
  `Instrucciones`.
- `hooks/useCobroQr.ts`: pide el QR una sola vez por venta y hace **polling cada 2,5 s** hasta
  que el estado deja de ser `PENDIENTE` (PAGADO o VENCIDO). La pantalla nunca confirma nada:
  solo refleja lo que el backend acreditó. Un error de red suelto no tumba la pantalla.
- `pages/PagoPage.tsx` (thin): `/pago/exito|cancelado` → `RegresoPasarela`;
  `?metodo=QR` → `PagoQr`; resto → `InstruccionesPago` (efectivo).
- `components/`: `pago-qr.tsx` (QR + monto, pasa a `qr-pagado.tsx` al acreditarse),
  `instrucciones-pago.tsx` (efectivo, muestra `motivo` si viene de un fallo de tarjeta),
  `regreso-pasarela.tsx` (+ `estado-regreso.tsx` y `hooks/useVentaDeRegreso.ts`: toma la venta de
  `?venta=` o, de respaldo, de `sessionStorage`, y
  consulta su estado real;
  si sigue pendiente ofrece "Pagar con QR" / "Pagar en efectivo" / reintentar; en
  `/pago/cancelado` además "Cancelar y volver al carrito"),
  `volver-al-carrito.tsx` (2026-11-03: botón que llama `paymentsApi.cancelar`, refresca el
  `CartContext` y navega a `/carrito`; el backend devuelve las prendas de la compra al carrito —
  antes "desaparecían" porque el checkout vacía el carrito. Se usa en `regreso-pasarela.tsx`
  (cancelado), `instrucciones-pago.tsx` y `cart/compra-pendiente`; prop opcional `onListo`),
  `detalle-pago-card.tsx`.

### `features/wayra/` ↔ backend `pagos` (banco simulado Wayra)
La "app del banco" que abre el QR desde el celular. Ruta pública `/wayra/pagar/:token`, sin
sesión ni layout de la tienda (representa otra app). El token del QR es la única llave.
- `api/wayraApi.ts`: `verCobro(token)` (`GET /wayra/cobros/:token`), `pagar(token, cuenta, pin)`
  (`POST /wayra/cobros/:token/pagar`).
- `types/wayra.types.ts`: espejo de `mirroria-backend/src/modules/pagos/dto/wayra.dto.ts`
  (`CobroWayra` con estado PENDIENTE/PAGADO/VENCIDO, cuentas enmascaradas, `ComprobanteWayra`).
- `hooks/useWayraPago.ts`: máquina de pasos `cargando → cobro → pin → procesando →
  comprobante` (o `no-encontrado`). Si el pago falla, recarga el cobro para mostrar su estado
  real (ej. ya pagado desde otro celular o vencido).
- `components/`: `wayra-marca.tsx` (marca propia del banco), `paso-cobro.tsx` (detalle +
  elección de cuenta), `teclado-pin.tsx` (PIN de 4 dígitos), `comprobante-wayra.tsx`,
  `aviso-cobro.tsx` (estados pagado/vencido). `pages/WayraPagoPage.tsx`.
- La acreditación real la hace el backend: Wayra avisa a la tienda con un mensaje firmado
  (HMAC) y la pantalla de `PagoQr` de la clienta cambia sola por el polling.

### `features/reservations/` ↔ backend `reservas` (RF09-12)
- `api/reservationsApi.ts`: `create`, `getMisReservas`, `getCupo` (`GET /reservas/mias/cupo`),
  `cancelar`, y para staff `getAll({sucursalId, estado})` y `cambiarEstado`.
- `types/`: `Reserva`, `CupoReserva` (puedeReservar, motivo, activas/máx, faltas, bloqueo,
  topes, anticipación mínima, ventana máxima, tolerancia).
- `hooks/useCupoReserva.ts`: carga el cupo solo con sesión; sin cupo cae en los defaults.
- `lib/ventanaReserva.ts` (+test): `min`/`max` del `datetime-local` en hora local (default
  +30 min / +48 h, `min` redondeado al minuto siguiente para no recibir 409).
- `lib/codigoReserva.ts` (+test): `codigoReserva(id)` = primeros 8 caracteres en mayúsculas
  (el mismo que busca el panel admin); `coincideCodigo()` tolera `#`, espacios y minúsculas.
- `lib/estadoReserva.ts`: etiquetas para la clienta (`EXPIRADA` → "Vencida", `NO_SHOW` → "No te
  presentaste").
- `components/reservar-en-tienda/`: `reservar-en-tienda.tsx` (JSX, siempre 1 unidad),
  `useReservarEnTienda.ts` (cupo, ventana, bloqueo, recarga tras cada intento),
  `cupo-reserva-info.tsx` ("Reservas activas: X de Y", motivo, aviso de tolerancia/falta).
- `pages/MyReservationsPage.tsx`: lista con código `#XXXXXXXX`, cancelar, aviso si
  `bloqueadaHasta`.

### `features/promotions/` ↔ backend `promociones`
`api/promotionsApi.ts` (listar, crear, cambiar estado, validar), `hooks/useCupones.ts` (admin),
`hooks/useValidarCupon.ts` (checkout: aplica/remueve y calcula descuento), `types/`.

### `features/providers/` ↔ backend `proveedores`
Solo `api/providersApi.ts` + `types/`; la UI está en `admin/pages/ProveedoresAdminPage.tsx` (columnas en `admin/components/proveedores-columns.tsx`, con órdenes abiertas/tránsito y "Nueva orden").

### `features/fitting/` ↔ backend `probador` (RF13, probador virtual web)
- `api/probadorApi.ts`: `POST /probador/token` → API key efímera (5 min). `DECART_API_KEY`
  nunca sale del backend; sin ella el endpoint responde 503 y el panel se queda en "Conectá con
  la IA".
- `hooks/useCamara.ts` (`getUserMedia`), `hooks/useProbadorIA.ts` (`createDecartClient` +
  `client.realtime.connect(stream, { model: models.realtime("lucy-vton-3.5") })`, expone el
  stream remoto y `probarPrenda()` que hace `set({prompt, image})` sin reconectar),
  `hooks/useProbador.ts` (orquesta cámara, IA, prendas probables, prenda inicial del enlace,
  foto descargable).
- `lib/`: `promptDePrenda.ts` (prompt en inglés "Substitute the current X with…"),
  `prendasProbables.ts` (productos con al menos una foto en `imagenes`), `pasosGuiados.ts`
  (cámara → IA → prenda) — todos con test.
- `components/`: `escena-probador.tsx` (stream de Decart o cámara cruda mientras conecta),
  `panel-guiado.tsx`, `tira-de-prendas.tsx`, `respaldo-sin-camara.tsx`.
- `pages/ProbadorPage.tsx` (thin). Público, no requiere cuenta.

### `features/reports/` ↔ backend `ia` (CU24/CU51-53, reportes dinámicos, tabla pivote y exportación Excel)
- `api/reportsApi.ts`: `preguntar` (`POST /ia/reportes`, 503 sin clave de IA), `preguntarHibrido`
  (`POST /ia/reportes/hibrido`, agente multi-paso con DuckDB), `consultar` (`POST /ia/reportes/consulta`),
  `exportarExcel` (`POST /ia/reportes/exportar-excel`, Blob binario con X-Tenant y Auth), `descargarExcel` (helper de descarga automática).
- `types/`: `reports.types.ts`, `reports-hybrid.types.ts` (`ReporteHibridoResponse` con `metrica` y `tipoGraficoSugerido`, `PasoEjecutado`, `FilaReporteHibrido`).
- `hooks/`: `useReportesIniciales` (tarjetas en paralelo), `useReportesChat` (conversación con `preguntarHibrido` + pasos agénticos + `abrirTabConReporte` + `actualizarReporteTab`),
  `useTablaDinamica` (filtrado en caliente, ordenación multi-columna, exportación Excel y repivoteo), `useDictado` (Web Speech API), `useTecladoDictado` (atajo barra espaciadora).
- `lib/`: `tabla-dinamica.utils.ts` (`filtrarFilas`, `ordenarFilas` + tests), `reportes-chat.utils.ts` (`mapHibridoAReporte`, `respuestaMeta`, `tituloDesdeTexto`), `report-value.utils.ts`, `report-chart.utils.ts`.
- `components/`: `chat-panel/` (con `ReasoningSteps` en las respuestas del asistente), `report-tabs/` (soporta `onActualizarReporte` ante repivoteo rápido),
  `reporte-resultado.tsx` (narrativa + `ReasoningSteps` + badge de "Escenario Simulado DuckDB" + gráfico + tabla dinámica), `report-chart.tsx` (Recharts con selección dinámica priorizando `tipoGraficoSugerido` y delegación a `WhatIfChart`),
  `what-if-chart/what-if-chart.tsx` (barras comparativas Real vs Proyectado), `tabla-dinamica-reporte.tsx` (tabla interactiva con cabeceras ordenables), `tabla-dinamica-toolbar.tsx` (filtro en caliente, selector rápido de dimensión y exportación a Excel), `tabla-dinamica-totales.tsx` (fila de totales dinámicos con variación ponderada),
  `constructor-reporte/` (`constructor-reporte-dialog.tsx`, `constructor-reporte-campos.tsx`, `constructor-reporte.data.ts` + tests: constructor manual sin coste de LLM con atajos de rangos temporales), `tabla-reporte.tsx`, `resumen-reportes.tsx`.

### `features/dashboard/` ↔ backend `bi` (Fase 5, CU39-40, BI y Dashboards por Rol)
- Punto de entrada en `/admin/dashboard` (redirección index de `/admin`).
- **Dashboard Ejecutivo BI (`ADMIN`)**:
  - Filtros temporales y de sucursales (`filtros-dashboard-ejecutivo.tsx`).
  - Tarjetas KPI con deltas simétricos (`kpi-grid-ejecutivo.tsx`): Ingresos, Ticket Promedio, Rotación de Inventario, Conversión Reservas a Ventas, Clientes Activos.
  - Gráficos Recharts: Tendencia de ingresos (`grafico-tendencia-ingresos.tsx`), Cuota de pasarelas Stripe/Wayra QR/Efectivo (`grafico-distribucion-pagos.tsx`), Top 5 Prendas (`grafico-top-prendas.tsx`), Top Proveedores (`grafico-top-proveedores.tsx`).
  - Consumo del Plan SaaS (`widget-limites-plan.tsx`) con barras de progreso contra límites de suscripción.
- **Dashboard Operativo POS (`CAJERO` y `ENCARGADO_SUCURSAL`)**:
  - Tarjetas de turno (`kpi-grid-operativo.tsx`): Ventas del día, Tickets emitidos, Cobros pendientes, Reservas de hoy.
  - Agenda cronológica de citas del día con botón "Atender en tienda" en 1 clic (`widget-reservas-hoy.tsx`).
  - Alertas de stock crítico ($\le 2$) y agotado ($0$) en la sucursal asignada (`widget-alertas-stock.tsx`).
  - Accesos rápidos operativos POS (`accesos-directos-pos.tsx`).
- Componentes < 120 líneas, 100% `@phosphor-icons/react`, zero páginas huérfanas (`ADMIN_NAV_GROUPS` item #1).

### `features/ml/` ↔ backend `ml` (Fase 6, CU41-44, Machine Learning Orientado a KPIs de Negocio)
- Punto de entrada en `/admin/ml` (`MlDashboardPage`), registrado en `STAFF_ROUTES` (`ADMIN` y `ENCARGADO_SUCURSAL`) y en `ADMIN_NAV_GROUPS` (grupo "Ventas y Promociones" con icono `Brain` y badge "IA").
- **M1: Demanda Predicha a 30 Días (Supervisado - Regresión)**:
  - `widget-demanda-predicha.tsx`: Tarjeta con gráfico comparativo Recharts (Demanda Proyectada vs Stock Real), KPIs de tasa de quiebre de stock y rotación esperada, y sugerencia accionable de reabastecimiento al proveedor con stock de seguridad (buffer 20%).
- **M2: Riesgo de No-Show en Agenda POS (Supervisado - Clasificación)**:
  - `badge-riesgo-noshow.tsx`: Semáforo interactivo Verde (< 30%), Amarillo (30-60%) y Rojo (> 60%).
  - `widget-noshow-agenda.tsx`: Agenda de citas del día evaluadas con Regresión Logística L2, factores explicativos de riesgo y botón de reconfirmación directa vía WhatsApp para reservas críticas.
  - Integrado de forma operativa en `widget-reservas-hoy.tsx` del Dashboard POS para alertar inmediatamente al personal de caja.
- **M3: Segmentación RFM (No Supervisado - Clustering)**:
  - `widget-rfm-segmentos.tsx`: Distribución de los 4 clústeres de clientas (VIPs/Leales, Nuevas Promesas, En Riesgo/Dormidas, Ocasionales/Outlet) mediante Donut/PieChart Recharts, con métricas de retención, CLV promedio y estrategias de marketing recomendadas.
- **M4: Auditoría de Ventas Anómalas (No Supervisado - Isolation Forest)**:
  - `widget-anomalias-ventas.tsx`: Auditoría de tickets POS con score de atipicidad, badges de criticidad y desglose de motivos sospechosos (descuentos manuales excesivos, transacciones en horarios atípicos, importes extraños).
- **Rigor Científico y Ficha de Modelos (SI2)**:
  - `widget-calidad-modelos.tsx`: Validación formal sobre holdout set determinista (`seed=42`, N=10.000) con métricas de rigor (R²: 0.884, MAE: 2.14, RMSE: 3.08, ROC-AUC: 0.892, F1: 0.826, Silueta: 0.582, Contaminación: 3%) y citas canónicas (Breiman 2001, Cox 1958, MacQueen 1967, Liu 2008).
- **Hooks y API**: `useDemandaMl`, `useNoShowAgenda`, `useRfmSegmentos`, `useAnomaliasVentas`, `useModelosMetricas` en `useMlKpis.ts`, cliente tipado en `mlApi.ts`.
- Componentes < 120 líneas de código, uso exclusivo de `@phosphor-icons/react`, soporte de fallback heurístico transparente y cero páginas huérfanas.

### `features/admin/` (panel interno)
- `pages/`: `CatalogoAdminPage` (tabs productos/categorías/colecciones/temporadas/tallas/
  colores), `ProveedoresAdminPage`, `SucursalesAdminPage` (sucursales/ciudades),
  `InventarioAdminPage` (stock + ajuste), `VentasAdminPage` (lectura), `ReservasAdminPage`,
  `CobrosAdminPage`, `CuponesAdminPage`, `UsuariosAdminPage`, `ReportesAdminPage`.
- `components/`: `simple-resource-manager/` (tabla + diálogo de alta genérico) y sus wrappers
  `categorias-`, `temporadas-`, `tallas-`, `colores-`, `colecciones-`, `ciudades-`,
  `sucursales-panel/`; `productos-panel/` (toolbar, tabla con empty state accionable "Cargar mi primera prenda",
  crear, editar, agregar variante, campos); `usuario-rol-editor/` (dialog + `rol-field`, `usuario-resumen`,
  `sucursal-field`);
  `stock-table/` (`stock-row.tsx`, `stock-sucursal-header.tsx`), `proveedores-columns.tsx`, `ajustar-stock-form/`; `ventas-table/` (badges en `.data.ts` con las claves
  reales de `EstadoVenta`: PENDIENTE "Pendiente de pago", PAGADA, ENTREGADA, CANCELADA,
  DEVUELTA_PARCIAL, DEVUELTA_TOTAL — antes PAGADO/COMPLETADO/CANCELADO no coincidían); `reservas-table/` (columna Código,
  badges por estado en `.data.ts`); `estado-acciones/`; `cobros-table/`; `cupones-table/`,
  `crear-cupon-dialog/`; `usuarios-table/`, `usuario-rol-editor/` (rol + sucursal).
  `UsuariosAdminPage` muestra en un `Alert` el `ApiError.message` del backend al activar/desactivar
  (ej. 409 "Es el último administrador activo"); el diálogo de rol ya mostraba el suyo.
- `api/usuariosAdminApi.ts` (rol y estado de usuarios).
- **Mostrador de reservas (`ReservasAdminPage`):** buscador por código (`coincideCodigo`),
  selector de sucursal solo para ADMIN (encargada/cajera ven la suya, lo fuerza el backend).
  `EstadoAcciones` espeja las transiciones válidas del backend:
  - `PENDIENTE` → Confirmar, Cliente llegó (`EN_TIENDA`), Cancelar, Expirar.
  - `CONFIRMADA` → Cliente llegó, Cancelar, No asistió (`NO_SHOW`), Expirar.
  - `EN_TIENDA` → No compró (`CANCELADA`, libera las prendas sin contar falta). Si compra, la
    reserva se cierra sola al cobrar la venta presencial.
- **Cobros (`CobrosAdminPage`):** lista `GET /pagos/pendientes` (solo efectivo desde que el QR
  se acredita solo) y confirma con `POST /pagos/:id/confirmar`.

### `features/errors/`
`pages/NotFoundPage.tsx`: comodín `*` (sin él la SPA quedaba en blanco, porque Nginx sirve
`index.html` para cualquier ruta). Acepta `titulo`/`detalle` opcionales para reusarla en un recurso
inexistente (ficha de prenda).

---

## 🛠️ 4. Reglas de Implementación para Agentes IA

1. **Nunca crear archivos monolíticos:** si un archivo supera 100-150 líneas, descomponer
   (constantes a `*.data.ts` si aplica 1.C, lógica a un hook o a `lib/`, subcomponentes a la
   carpeta del componente).
2. **Usar siempre el alias `@/`**, nunca rutas relativas largas.
3. **No usar `'use client'`:** SPA en Vite, no Next.js.
4. **Navegación con `react-router-dom`:** `<Link to>` en vez de `<a href>`, `useNavigate()`.
5. **Formularios:** RHF + Zod para formularios no triviales; controlados simples para triviales.
6. **Estados de carga/error:** todo componente con peticiones contempla `loading`/`error`/
   `success`; mostrar el `message` real del backend (`ApiError`).
7. **Dinero en centavos hasta el render:** siempre `formatMoney()` de `lib/money.ts`.
8. **Roles:** cada ruta nueva de staff declara los mismos roles que el `@Roles(...)` del
   controller del backend, en `App.tsx` **y** en `admin-sidebar-content.tsx`.
9. **`Select` de Base UI:** `SelectValue` con `children` como función de lookup
   (`(id) => opciones.find(...)?.label ?? placeholder`) y `value={x ?? ""}` desde el primer
   render; nunca `<SelectValue placeholder="..." />` auto-cerrado si el value no es el label.
   Para "todas" usar un centinela (`"__todas__"`), y llamar `reload()` en `onValueChange`
   (`useResourceList` no reacciona al cambio de `fetchFn`).
10. **Imágenes:** contenedor `relative` con alto fijo/acotado + `img absolute inset-0 h-full
    w-full object-cover`; nunca `h-full` sobre un `<img>` cuyo padre no tiene alto definido.
    Probar en 1920 y 2560 px además de 390/1024/1366/1440.
11. **Ninguna página huérfana:** toda ruta nueva debe tener un link desde header, footer,
    sidebar o un flujo (excepción documentada: `/wayra/pagar/:token`, que se abre por QR).

---

## 🗺️ 5. Pendientes e inconsistencias conocidas (2026-11-05)

- **Sin POS a propósito (decisión del usuario):** la tienda física tiene su propio sistema de caja;
  `POST /ventas/presenciales` existe en el backend sin pantalla. La web solo verifica pagos en persona
  (`/admin/cobros`) y resuelve reservas (`/admin/reservas`). No construir un POS.
- **Fase 2 (siguiente):** `/admin/suscripcion/activar` y el botón "Pagar" de `/admin/suscripcion` muestran las pasarelas
  como "Próximamente"; ahí se conectan las pasarelas enchufables.
- **Login/registro:** falta botón para mostrar la contraseña. Dictado por voz de reportes sin probar en un navegador real.
- **P3 de la auditoría 1b:** texto muted "Elegí tienda y horario…" de Tiendaria con contraste 4.35:1; el título de pestaña del
  admin es "MirrorIA"; en el paso 2 del alta la vista previa no es sticky. En `/t/tiendaria/login` el panel de foto dice
  "Tiendaria / Tiendaria".
- **`/probador/token`** es público (gasta crédito de Decart); el backend lo limita a 10 tokens cada 10 min por IP.
- **App móvil:** `mirroria-mobile/` está congelada y se rehará desde cero; la web y el backend se optimizan como si no
  existiera.

---

## 📜 6. Historial condensado (2026-09-12 → 2026-11-05)

Solo lo que explica por qué el código es como es; el detalle de cada sesión quedó en git.

- **2026-09-12 — Scaffold y landing:** Vite + React 19 + Tailwind v4, `shadcn init` preset
  Nova (Base UI). Decisiones de la skill `design-taste-frontend`: Geist como única fuente (sin
  serif), acento único vino/rosa sobre base neutra fría (evita el cliché beige+borgoña), radio
  único, Phosphor para iconos. Fotos placeholder reales de `images.unsplash.com` (no
  `plus.unsplash.com`, que es de pago). Bug del CLI: `shadcn add` escribía en `./@/` → fix con
  `paths` en el `tsconfig.json` raíz.
- **2026-09-12 — Auth:** `AuthContext` (el navbar debe reaccionar en vivo al login), `apiFetch`
  excluye `/seguridad/auth/*` del manejo de 401 (antes "Credenciales incorrectas" salía como
  "Sesión expirada"). `AuthLayout` split-screen.
- **2026-09-13 — Imágenes y hero:** fix de imágenes que desbordaban el viewport (alto fijo,
  nunca derivado del ancho); hero full-bleed con `unsplashUrlNative()` (sin recorte de servidor)
  y alturas `xl`/`2xl` + tope `max-w-[2200px]` para no cortar la cara en 1920/2560 px. Luego la
  foto del hero pasó a `public/images/hero-model.jpg`.
- **2026-09-13 — E-commerce:** tienda, ficha, carrito, checkout. Simplificaciones a propósito:
  filtro de categoría en el cliente, enriquecido del carrito N+1, sin stepper de cantidad.
  `ProtectedRoute` creado al existir la primera página que lo necesitaba. `inventory/` promovido
  desde `catalog/` cuando el admin necesitó ajustes.
- **2026-09-13/14 — Panel admin:** vive en este mismo proyecto, gateado por rol (no un segundo
  React). `SimpleResourceManager` para los CRUD simples; `AdminLayout` con sidebar agrupado,
  responsive y optimizado para 1080p/2K/4K. Se eliminó una lista de ciudades inventada
  (`BRANCH_CITIES`) a favor de datos reales.
- **2026-09-14/15 — Reservas, usuarios/roles, imágenes reales de productos, edición de
  productos y cupones** (RF02, RF09-12, promociones con validación en checkout).
- **2026-09-22 — Auditoría de 89 commits ajenos (`pagos`, reportes CU24):** se partieron
  `PagoPage` (310 → 13 líneas), `CobrosAdminPage` (tabla a `cobros-table/`) y `App.tsx` (rutas
  data-driven); `<details>` nativo reemplazado por `Collapsible` de shadcn.
- **2026-09-27 — Probador web a Decart VTON:** se borró el detector de pose propio
  (`@mediapipe/tasks-vision`, 28 MB de wasm, `usePose`, `landmarkMath`, etc.) y el harness de
  Playwright; nuevo `useProbadorIA`/`useProbador`/`promptDePrenda`. Backend ganó
  `modules/probador/` (token efímero). Fix posterior: el botón "Probármela" no aparecía por un
  gate viejo; la tarjeta "Vestidor virtual" de la landing enlaza al probador.
- **2026-09-27 — Docker:** separación `nginx.conf` (local HTTP) / `nginx.prod.conf` (SSL) con
  `ARG NGINX_CONF`.
- **2026-09-29 — Reglas de reserva y compra en la tienda:** cupo, ventana +30 min/+48 h, siempre
  1 unidad, etiquetas "Vencida"/"No te presentaste", error real al agregar al carrito.
- **2026-09-29 — Código de reserva y acciones de caja:** código `#XXXXXXXX` en Mis reservas,
  buscador y columna Código en el admin, "Cliente llegó" desde PENDIENTE y "No compró" desde
  EN_TIENDA; staff de sucursal sin selector.
- **2026-11-03 — Merge de `pago-qr`:** cobro por QR dinámico con polling y banco simulado Wayra
  (`features/wayra`, `/wayra/pagar/:token`). Se quitó el QR fijo (`PAGOS_QR_URL`); el cobro
  manual quedó solo para efectivo.
- **2026-11-04 — Limpieza y rendimiento:** borrados `public/prendas/` (13 PNG, 3.2 MB, recortes
  del AR viejo), su `location ^~ /prendas/` de Nginx, el campo "Imagen para Vestidor AR" de los
  formularios de producto, `ui/collapsible.tsx` (ya sin importadores) y `reportsApi.historial`.
  Hero a `.webp` (244 → 93 kB). Carga diferida de admin/probador/Wayra y gzip + caché inmutable
  de `/assets/` en Nginx (ver §0 y §2).
- **2026-11-04 — Limpieza profunda:** fuera `modeloArUrl`, `arOverlayImageUrl` e
  `imagenes[].esArAsset` de `catalog.types.ts`, `catalogApi.ts`, los diálogos de producto y los
  tests; fuera `usuarioId` de `OrdenCompra`. Iconos unificados en Phosphor y `lucide-react`
  desinstalado. `.agents/`, `.claude/` (symlinks a `.agents/skills`) y `skills-lock.json` dejaron
  de versionarse: siguen en disco para Claude Code/Antigravity, pero son herramientas locales.
  El único probador es Decart (`features/fitting`).
- **2026-11-04 — "Mis pedidos" y carrito:** `features/orders` (`/mis-pedidos`), stepper de cantidad 1-3 en el carrito,
  reportes IA híbridos (`ReasoningSteps`, `WhatIfChart`).
- **2026-11-05 — Fase 1 SaaS (commit `d6d05f6`):** rutas de tienda bajo `/t/:slug`, `LegacyRedirect` de las viejas, landing
  SaaS, alta de tienda, `/admin/suscripcion`, panel `/plataforma/*`, `X-Tenant` en `apiFetch`, `CartProvider` a `TiendaRoot`.
- **2026-11-05 — Fase 1b (commit `f91938c`):** identidad de la plataforma (entonces "Tiendaria"; índigo + lima), tema por tienda (`lib/tema/`),
  `/admin/apariencia`, `/admin/suscripcion/activar`, dashboard de plataforma, landing nueva con cifras vivas.
- **2026-11-06 — Fase 3: Operación Offline, PWA, Idempotencia y Manejo de Conflictos:**
  * PWA: `public/manifest.webmanifest` (start_url "/", theme_color "#281b89", standalone) y `public/sw.js` (App shell Cache-First, fallback /index.html en navegaciones para arranque de la SPA en modo avión, Network-First para API). Registro en `src/main.tsx`.
  * IndexedDB (`src/lib/offline/idb.ts`): almacenes `catalogo_cache` (TTL 7 días según requerimiento de cátedra) y `outbox` (cola FIFO, estados `PENDIENTE`, `SINCRONIZANDO`, `SINCRONIZADO`, `COMPENSADO`, `FALLIDO`).
  * Gestor Outbox (`src/lib/offline/outbox-manager.ts`): listener de conectividad `window.ononline`/`offline`, drenado FIFO de mutaciones enviando cabecera `Idempotency-Key: <uuid>`, manejo del choque `stock = 1` ante HTTP 409 `STOCK_AGOTADO_CONFLICTO` marcando `COMPENSADO` y emitiendo evento `mirroria:conflicto-stock`.
  * Cliente HTTP (`src/lib/api.ts`): inyección automática de `Idempotency-Key` en operaciones mutantes (`POST`, `PUT`, `PATCH`), captura tipada de `codigo` y `detalles` en `ApiError`.
  * UI (< 120 líneas, 100% Phosphor Icons): `EstadoConexionBadge` (indicador de red con conteo de pendientes en `AdminLayout` y `SiteHeader`), `ListaOutboxSheet` (panel lateral con historial y botón de sincronización manual), `ModalConflictoStock` (diálogo accesible en `App.tsx` para explicar y compensar choque de concurrencia con alternativas de sucursal y talla). Tests: 140 vitest (25 suites).

---

## 💡 7. Sugerencias abiertas

1. **TanStack Query** para estado de servidor en vez de `useEffect` + `fetch` manual (hoy cada
   hook repite loading/error/reload). No aplicado: se mantuvo el patrón de `case-frontend`.
2. **`ProductGallery`** (carrusel de `producto.imagenes`) en la ficha; hoy se muestra la
   primera foto o `ProductImagePlaceholder`.
3. Resueltas y ya incorporadas: `lib/money.ts` desde el día 1 y tema visual definido antes de
   instalar shadcn.
