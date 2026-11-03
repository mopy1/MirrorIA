# 🪞 MirrorIA Frontend — Arquitectura, Árbol Real y Lógica por Feature

Este documento define la arquitectura técnica, los patrones de diseño y la estructura de
carpetas de `mirroria-frontend`. Es la fuente de verdad exclusiva del frontend web — el
`AGENTS.md` de la raíz del repo (`../AGENTS.md`) solo enlaza para acá. La arquitectura y las
reglas son una adaptación directa de `sw-case/case-frontend/AGENTS.md` (mismo patrón y mismo
criterio de cuándo aplicar cada regla), llevada al dominio de MirrorIA (e-commerce de moda
femenina multi-sucursal).

Cualquier agente IA o desarrollador que trabaje en esta base de código **DEBE** seguir estas
directrices de forma obligatoria.

> **Actualizado: 2026-11-03 (commit `4509622`).** Las secciones 2 y 3 describen lo que existe
> hoy en `src/`, verificado contra `src/App.tsx` y `src/features/*`. El historial de sesiones
> anteriores (2026-09-12 a 2026-09-29) está condensado en la sección 6: solo quedan las
> decisiones y lecciones que siguen vigentes.

---

## 🧰 0. Stack y herramientas

- **Framework:** Vite + React 19 + TypeScript (~6.0) + Tailwind v4 (vía `@tailwindcss/vite`,
  sin `tailwind.config.js`). `react-router-dom` 7 (`BrowserRouter` en `App.tsx`);
  `AuthProvider` y `CartProvider` envuelven `<App />` en `main.tsx`.
- **UI: shadcn/ui**, preset **Nova** sobre **Base UI** (no Radix). Primitivas instaladas en
  `src/components/ui/`: alert, aspect-ratio, avatar, badge, button, card, chart, collapsible,
  dialog, field, input, label, navigation-menu, select, separator, sheet, skeleton, table, tabs,
  textarea. `cn` viene del paquete npm `cn` (`import { cn } from "cn"`) — **no** existe
  `lib/utils.ts`, no crearlo.
- **Identidad visual:** Geist Variable (`@fontsource-variable/geist`) como única tipografía;
  acento único vino/rosa profundo en `--primary`/`--ring` (`src/index.css`), resto neutro frío;
  `--radius: 0.75rem`. Iconos de contenido con **Phosphor** (`@phosphor-icons/react`); Lucide
  solo donde lo usan los primitivos generados por shadcn. Animación con `motion` (`motion/react`).
- **Otras dependencias:** React Hook Form + Zod (`@hookform/resolvers`), Recharts (reportes),
  `@decartai/sdk` (probador virtual).
- **Alias `@/*` → `src/*`:** en `vite.config.ts`, `tsconfig.app.json` **y** en el
  `tsconfig.json` raíz (este último es necesario para que `shadcn add` no escriba en una
  carpeta literal `./@/`).
- **Cliente HTTP:** `fetch` nativo envuelto en `lib/api.ts` (`apiFetch()`, `ApiError`): agrega
  `Authorization: Bearer` desde `localStorage`, une `message[]` del backend en un texto, y ante
  un `401` (excepto en `/seguridad/auth/*`, donde 401 = credenciales incorrectas) limpia la sesión
  y manda a `/login`.
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
  `docker-compose.prod.yml`). Contenedor `mirroria_frontend`.

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
   extraen a un `*.data.ts` cuando aplica el criterio C. Las rutas de `App.tsx` también son
   data-driven (`STOREFRONT_ROUTES`, `ADMIN_ROUTES`, `STAFF_ROUTES`).

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

## 🗺️ 2. Rutas (`src/App.tsx`)

| Ruta | Página | Guard / Layout |
|---|---|---|
| `/` | `catalog/HomePage` | público, `StorefrontLayout` |
| `/tienda` (`?categoria=`, `?q=`) | `catalog/ProductListPage` | público |
| `/tienda/producto/:id` | `catalog/ProductDetailPage` | público |
| `/sucursales` | `branches/BranchesPage` | público |
| `/probador`, `/probador/:productoId` | `fitting/ProbadorPage` | público |
| `*` | `errors/NotFoundPage` | público |
| `/carrito` | `cart/CartPage` | `ProtectedRoute` |
| `/checkout` | `checkout/CheckoutPage` | `ProtectedRoute` |
| `/checkout/:id/confirmacion` | `checkout/OrderConfirmationPage` | `ProtectedRoute` — ⚠️ huérfana |
| `/pago/:ventaId` (`?metodo=QR`) | `payments/PagoPage` | `ProtectedRoute` |
| `/pago/exito`, `/pago/cancelado` | `payments/PagoPage` | `ProtectedRoute` |
| `/reservas` | `reservations/MyReservationsPage` | `ProtectedRoute` |
| `/wayra/pagar/:token` | `wayra/WayraPagoPage` | público, **sin** layout de tienda |
| `/login`, `/register` | `auth/LoginPage`, `auth/RegisterPage` | `GuestRoute` (`AuthLayout` dentro de la página) |
| `/admin` | → `/admin/catalogo` | redirect |
| `/admin/catalogo`, `/admin/proveedores`, `/admin/sucursales`, `/admin/cupones`, `/admin/usuarios` | `admin/*AdminPage` | `AdminRoute` (ADMIN exacto) + `AdminLayout` |
| `/admin/inventario`, `/admin/ventas` | `admin/*AdminPage` | `StaffRoute` ADMIN, ENCARGADO_SUCURSAL |
| `/admin/reservas` | `admin/ReservasAdminPage` | `StaffRoute` ADMIN, ENCARGADO_SUCURSAL, CAJERO |
| `/admin/cobros` | `admin/CobrosAdminPage` | `StaffRoute` ADMIN, CAJERO |
| `/admin/reportes` | `admin/ReportesAdminPage` | `StaffRoute` default (ADMIN, ENCARGADO_SUCURSAL) |

**Navegación (sin páginas huérfanas salvo la marcada):**
- Header (`layouts/site-header/`): Tienda, Sucursales, menú de Categorías (en vivo desde
  `useCategorias`), buscador, carrito con badge. `header-auth.tsx`: sin sesión → login/registro;
  con sesión → "Mis reservas" + link de staff por rol (`ADMIN` → `/admin`, `CAJERO` →
  `/admin/cobros`, `ENCARGADO_SUCURSAL` → `/admin/reportes`, porque `/admin` redirige a una ruta
  solo ADMIN).
- Footer (`site-footer.data.ts`): Catálogo, Vestidor virtual (`/probador`), Sucursales,
  Reservas, Contacto (`#contacto`); Términos y Privacidad apuntan a `#` (placeholder).
- Hero y feature-highlights enlazan a `/tienda` y `/probador`; la ficha enlaza a
  `/probador/:id`.
- Sidebar admin (`admin-sidebar-content.tsx`): filtra ítems por `roles` (mismos del router) y
  oculta los grupos vacíos.
- `/wayra/pagar/:token` no tiene link interno a propósito: se llega escaneando el QR.
- `/checkout/:id/confirmacion` **no la alcanza ningún flujo** desde que el checkout navega a
  `/pago/:ventaId` — candidata a borrar o a reutilizar como "Mis pedidos".

---

## 🌲 3. Árbol real de `mirroria-frontend` y lógica por feature

```text
mirroria-frontend/
├── public/
│   ├── favicon.svg
│   ├── images/hero-model.jpg          # foto del hero, local
│   └── prendas/*.png                  # recortes del vestidor AR viejo (ver §5, legado)
├── src/
│   ├── main.tsx                       # AuthProvider > CartProvider > App
│   ├── App.tsx                        # rutas data-driven (ver §2)
│   ├── index.css                      # tokens de tema (acento vino/rosa), Tailwind v4
│   ├── components/
│   │   ├── ui/                        # primitivas shadcn (Base UI)
│   │   ├── brand-logo.tsx             # logotipo MirrorIA
│   │   └── common/
│   │       ├── SearchInput.tsx        # navega a /tienda?q=
│   │       └── ProductImagePlaceholder.tsx  # fallback cuando un producto no tiene foto
│   ├── context/
│   │   ├── AuthContext.tsx + auth-context.ts   # usuario, token, login/logout (contexto separado por fast-refresh)
│   │   └── CartContext.tsx + cart-context.ts   # carrito, itemCount, refresh()
│   ├── hooks/                         # globales
│   │   ├── useAuth.ts, useCart.ts
│   │   ├── useResourceList.ts         # lista + loading/error + reload() (reacciona a reloadKey, no a fetchFn)
│   │   └── useCreateResource.ts       # submit + loading/error para mutaciones
│   ├── layouts/
│   │   ├── StorefrontLayout.tsx       # site-header + site-footer
│   │   ├── site-header/               # site-header, header-auth, categories-menu, *.data.ts
│   │   ├── site-footer/               # site-footer + site-footer.data.ts (+ test)
│   │   ├── AuthLayout.tsx             # split-screen con foto (login/registro)
│   │   ├── AdminLayout.tsx            # header + Sheet en móvil + aside en desktop
│   │   └── admin-sidebar-content.tsx  # nav agrupada filtrada por rol + perfil + "Tienda"/logout
│   ├── lib/
│   │   ├── api.ts                     # API_URL, apiFetch(), ApiError
│   │   ├── money.ts                   # formatMoney(cents) es-BO / BOB
│   │   ├── unsplash.ts                # unsplashUrl(), unsplashUrlNative()
│   │   └── estado-de-lista.ts (+test) # "cargando" | "vacio" | "con-datos"
│   ├── routes/
│   │   ├── ProtectedRoute.tsx         # exige sesión
│   │   ├── GuestRoute.tsx             # con sesión, fuera de /login y /register
│   │   ├── AdminRoute.tsx             # sesión + ADMIN exacto
│   │   └── StaffRoute.tsx             # sesión + allowedRoles (default REPORTES_ROLES)
│   └── features/                      # ver detalle abajo
├── Dockerfile, nginx.conf, nginx.prod.conf
├── components.json                    # config shadcn (preset Nova, Base UI)
├── vite.config.ts                     # alias @, puerto 5174
└── tsconfig.json / tsconfig.app.json / tsconfig.node.json
```

### `features/auth/` ↔ backend `seguridad`
`api/authApi.ts` (login, register, me), `types/auth.types.ts` (`UsuarioRole`: CUSTOMER,
ADMIN, ENCARGADO_SUCURSAL, CAJERO), `hooks/{useLogin,useRegister}.ts` (navegan a `/` al
terminar), `components/{login-form,register-form}/` (RHF + Zod, mismas validaciones que el
backend), `pages/{LoginPage,RegisterPage}.tsx`.

### `features/catalog/` ↔ backend `catalogo`
- `api/catalogApi.ts`: CRUD de productos, variantes, categorías, temporadas, colecciones,
  tallas y colores (tienda + admin). `types/catalog.types.ts`.
- `hooks/`: `useProductos` (filtro por categoría/búsqueda en el cliente), `useProducto`,
  `useCategorias`, `useVariantesConProducto` (catálogo aplanado por variante, lo usan `cart` e
  inventario admin).
- `components/`: `hero-section/` (full-bleed, `.data.ts` + test), `feature-highlights/`,
  `category-showcase/` (foto real de una prenda por categoría; `columnas.ts` + test),
  `branches-strip/`, `contact-section/`, `product-card/`, `product-grid/`,
  `product-detail/` (variantes talla/color con `variant-swatch-group`, `estado-stock.tsx`,
  `useAgregarAlCarrito.ts` que muestra el error real del backend — ej. tope de 3 unidades —,
  link "Probármela" a `/probador/:id` y `ReservarEnTienda`).
- `pages/`: `HomePage`, `ProductListPage` (`?categoria=`, `?q=`), `ProductDetailPage`.

### `features/branches/` ↔ backend `sucursales`
`api/branchesApi.ts` (ciudades + sucursales), `hooks/useSucursales.ts`,
`components/branch-picker/` (usado en checkout y reservas; `SelectValue` con children de
lookup), `pages/BranchesPage.tsx`.

### `features/inventory/` ↔ backend `inventario`
`api/inventoryApi.ts` (disponibilidad por sucursal, ajustes), `hooks/useDisponibilidad.ts`
(stock en la ficha), `types/`.

### `features/cart/` ↔ backend `ventas` (carrito)
`api/cartApi.ts` (get, addItem, removeItem por `usuarioId`), `hooks/useCartLineItems.ts`
(enriquece `{varianteId, cantidad}` con producto/variante en el cliente),
`components/{cart-item,cart-summary}/`, `pages/CartPage.tsx`. El estado global vive en
`context/CartContext`. No hay stepper de cantidad (el backend no expone PATCH de cantidad).

### `features/checkout/` ↔ backend `ventas` + `pagos`
- `api/checkoutApi.ts`: `checkout(usuarioId, sucursalId, codigoCupon?)`, `getVenta`, `getVentas`.
- `hooks/useCheckout.ts`: crea la venta (vacía el carrito) y según el método:
  - `TARJETA` → `paymentsApi.iniciarTarjeta` → guarda `mirroria_pago_venta_id` en
    `sessionStorage` y redirige a Stripe; si falla (503 sin claves) navega a `/pago/:id` con
    `state.motivo`.
  - `QR` → `/pago/:id?metodo=QR`. `EFECTIVO` → `/pago/:id?metodo=EFECTIVO`.
- `components/{order-summary,cupon-input}/`, `pages/CheckoutPage.tsx` (resumen, cupón,
  `BranchPicker`, selector Tarjeta/QR/Efectivo), `pages/OrderConfirmationPage.tsx` +
  `hooks/useVenta.ts` (⚠️ sin navegación entrante, ver §2).

### `features/payments/` ↔ backend `pagos`
- `api/paymentsApi.ts`: `iniciarManual(ventaId, "EFECTIVO")`, `iniciarTarjeta`, `iniciarQr`
  (`POST /pagos/ventas/:id/qr`, crea o reutiliza el QR), `estadoQr` (`GET /pagos/qr/:pagoId`),
  `pendientes`, `confirmar`.
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
  `regreso-pasarela.tsx` (toma la venta de `?venta=` o, de respaldo, de `sessionStorage`, y
  consulta su estado real;
  si sigue pendiente ofrece "Pagar con QR" / "Pagar en efectivo" / reintentar),
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
  (el mismo del Pase de Tienda del móvil); `coincideCodigo()` tolera `#`, espacios y minúsculas.
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
Solo `api/providersApi.ts` + `types/`; la UI está en `admin/pages/ProveedoresAdminPage.tsx`.

### `features/fitting/` ↔ backend `probador` (RF13, probador virtual web)
- `api/probadorApi.ts`: `POST /probador/token` → API key efímera (10 min). `DECART_API_KEY`
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

### `features/reports/` ↔ backend `ia` (CU24, reportes por lenguaje natural)
- `api/reportsApi.ts`: `preguntar` (`POST /ia/reportes`, 503 sin clave de IA), `consultar`
  (`POST /ia/reportes/consulta`, ficha armada a mano, funciona sin IA), `historial`
  (`GET /ia/interacciones`, hoy sin uso en la UI).
- `hooks/`: `useReportesIniciales` (tarjetas de `reportes-iniciales.data.ts` en paralelo, cada
  una con su propio estado), `useReportesChat` (conversación + pestañas de resultados),
  `useDictado` (Web Speech API).
- `components/`: `chat-panel/`, `report-tabs/`, `reporte-resultado.tsx`, `report-chart.tsx`
  (Recharts), `tabla-reporte.tsx`, `resumen-reportes.tsx`; `lib/` con utilidades de gráfico y
  valores.

### `features/admin/` (panel interno)
- `pages/`: `CatalogoAdminPage` (tabs productos/categorías/colecciones/temporadas/tallas/
  colores), `ProveedoresAdminPage`, `SucursalesAdminPage` (sucursales/ciudades),
  `InventarioAdminPage` (stock + ajuste), `VentasAdminPage` (lectura), `ReservasAdminPage`,
  `CobrosAdminPage`, `CuponesAdminPage`, `UsuariosAdminPage`, `ReportesAdminPage`.
- `components/`: `simple-resource-manager/` (tabla + diálogo de alta genérico) y sus wrappers
  `categorias-`, `temporadas-`, `tallas-`, `colores-`, `colecciones-`, `ciudades-`,
  `sucursales-panel/`; `productos-panel/` (tabla, crear, editar, agregar variante, campos);
  `stock-table/`, `ajustar-stock-form/`; `ventas-table/`; `reservas-table/` (columna Código,
  badges por estado en `.data.ts`); `estado-acciones/`; `cobros-table/`; `cupones-table/`,
  `crear-cupon-dialog/`; `usuarios-table/`, `usuario-rol-editor/` (rol + sucursal).
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
`index.html` para cualquier ruta).

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

## 🗺️ 5. Pendientes e inconsistencias conocidas (2026-11-03)

- **POS / punto de caja (RF17-18):** `POST /ventas/presenciales` existe en el backend, no hay
  pantalla. Hoy la caja usa `/admin/reservas` y `/admin/cobros`.
- **"Mis pedidos" web:** no existe; el 409 de "2 compras sin pagar" del checkout la menciona sin
  link.
- **`OrderConfirmationPage` (`/checkout/:id/confirmacion`) huérfana** desde que el checkout
  navega a `/pago/:ventaId`.
- **`reportsApi.historial` sin uso** en la UI.
- **Legado del vestidor AR:** `public/prendas/*.png`, el campo `arOverlayImageUrl` (formularios
  de producto del admin y tipos) y la `location ^~ /prendas/` de Nginx eran del AR del móvil, que
  también migró a Decart el 2026-09-29. Verificar si alguien los sigue usando antes de borrarlos.
- **Footer:** "Términos y condiciones" y "Privacidad" apuntan a `#`.
- **Login/registro:** falta botón para mostrar la contraseña (el móvil lo tiene).
- **`/probador/token`** es público y sin rate-limiting (gasta crédito de Decart).

---

## 📜 6. Historial condensado (2026-09-12 → 2026-11-03)

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

---

## 💡 7. Sugerencias abiertas

1. **TanStack Query** para estado de servidor en vez de `useEffect` + `fetch` manual (hoy cada
   hook repite loading/error/reload). No aplicado: se mantuvo el patrón de `case-frontend`.
2. **`ProductGallery`** (carrusel de `producto.imagenes`) en la ficha; hoy se muestra la
   primera foto o `ProductImagePlaceholder`.
3. Resueltas y ya incorporadas: `lib/money.ts` desde el día 1 y tema visual definido antes de
   instalar shadcn.
