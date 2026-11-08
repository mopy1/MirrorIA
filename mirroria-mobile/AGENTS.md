# 📱 mirroria-mobile — App móvil de MirrorIA (Nivel 3)

> **App solo para clienta (`CUSTOMER`) y visitante. Sin punto de venta.** Las cuentas de personal
> (`ADMIN`, `ENCARGADO_SUCURSAL`, `CAJERO`, `DUENO_PLATAFORMA`) se rechazan en el login: "usala en la web".
> Spec cerrada: vault `U/2-2026/SI2/Parcial2/Movil_Spec.md` (manda sobre este archivo). Plan: `Plan_Movil.md`.
> Estado: **M0 + M1 + M2 + M3 hechos** (scaffold, tema, acceso, espejo SQLite, vitrina/ficha offline, `OutboxManager`, carrito/checkout/reserva
> encolables, `ModalConflictoStock`, Pendientes; **M3:** pago real QR Wayra/Stripe/"Pagar en caja", Mis pedidos, Mis reservas, Pase de Tienda
> con recordatorio local, "Comprar lo que reservé" y dashboard con KPIs; probado de punta a punta en el POCO; **M4.1** escáner de etiqueta y
> **M4.2** "Avisame cuando vuelva" + deslizar para quitar del carrito, 2026-11-08). Pendiente: M4.3–M4.5 (dev build y probador Decart).

## 1. Stack (versiones exactas, spec §1.1)

| Pieza | Versión |
|---|---|
| Expo SDK / RN / React | `expo` 58.0.23 · `react-native` 0.88.1 · `react` 19.3.0 (New Architecture) |
| Navegación | `expo-router` 58.0.30 (rutas en `src/app/`, tabs JS de `expo-router/js-tabs`) |
| UI | NativeWind 4.2.7 + Tailwind 3.4.19 · React Native Reusables (`@rn-primitives/*` 1.5.x) · íconos **Phosphor** 3.0.6 (nunca lucide) |
| Animación | Reanimated 4.7.1 + Worklets 0.13.0 (una sola copia) |
| Datos | TanStack Query 5.107.1 · react-hook-form 7.91.0 + zod 4.6.7 |
| Local | `expo-sqlite` 58.0.15 (`mirroria_local.db`) · `expo-secure-store` 58.0.2 · `expo-crypto` 58.0.7 |
| Red | `@react-native-community/netinfo` 12.0.1 |
| Fuentes | Bricolage Grotesque (títulos MirrorIA/`geist`), Geist (cuerpo), Geist Mono (montos/SKU), Outfit, DM Sans, Playfair |
| En uso desde M3 | `expo-notifications` (recordatorio local), `expo-web-browser` (Stripe), `react-native-qrcode-svg` (Pase), `expo-haptics` |
| En uso desde M4 | `expo-camera` (escáner, QR + Code128), `react-native-gesture-handler` v3 (`usePanGesture`, deslizar en el carrito) |
| **No instalado aún** | Decart/LiveKit (M4, *development build*) |

## 2. Levantar en el POCO X3 Pro (Expo Go 58.0.5, ADB inalámbrico)

```bash
cp .env.example .env                       # EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
adb devices -l                             # 192.168.100.160:<puerto> (el puerto cambia)
adb reverse tcp:3000 tcp:3000              # backend (contenedor mirroria_backend)
adb reverse tcp:8081 tcp:8081              # Metro
adb reverse tcp:8080 tcp:80                # opcional: logos /images/* del frontend Docker
npx expo start --localhost
adb shell am start -a android.intent.action.VIEW -d exp://127.0.0.1:8081
```
Expo Go para SDK 58: APK oficial `https://github.com/expo/expo-go-releases/releases/download/Expo-Go-58.0.5/Expo-Go-58.0.5.apk`
(URL de `https://api.expo.dev/v2/versions` → `sdkVersions["58.0.0"].androidClientUrl`), `adb install -r`.
Cuentas: clienta `clienta@mirroria.com` (tiendaria) · personal para probar el rechazo `cajera.centro@mirroria.com` (clave dev en vault `Parcial1/App/Database.md`).

**Comandos de calidad:** `npx tsc --noEmit` · `npx expo lint` · `npx expo-doctor` · `npm test` (node:test + node:sqlite, sin deps).

## 3. Árbol

```text
mirroria-mobile/
├── app.json · babel.config.js · metro.config.js · tailwind.config.js · components.json · eslint.config.js
├── nativewind-env.d.ts · tsconfig.json (alias @/* → src/*) · .env.example
├── docs/capturas/{m1,m2,m3,m4}/ # capturas del POCO para el PDF (m3: pagos, pase…; m4: escáner, avisos, deslizar)
└── src/
    ├── global.css               # tokens por defecto (MirrorIA claro/oscuro) en "R G B"
    ├── app/                     # SOLO rutas: `export { default } from '@/features/...'`
    │   ├── _layout.tsx          # PantallaMovilApp: fuentes + SQLite + NetInfoListener → Query/Tienda/Sesión/Tema → Stack + PortalHost
    │   ├── index.tsx            # redirector: sin tienda → /tiendas, con tienda → /vitrina
    │   ├── tiendas.tsx          # selector de boutique (tema MirrorIA)
    │   ├── acceso/{_layout,login,registro}.tsx
    │   └── (tabs)/_layout.tsx   # Vitrina · Probador · Carrito (badge) · Mis cosas
    │       ├── vitrina/{index, escanear, [productoId]/index, [productoId]/reservar}
    │       ├── probador/index
    │       ├── carrito/index
    │       └── mis-cosas/{index, pedidos/{index,[ventaId]}, reservas/{index,[reservaId]}, pago/[ventaId], pendientes, avisos}
    ├── components/
    │   ├── ui/                  # RNR (button, text, card, badge, input, label, dialog, alert-dialog, tabs, separator,
    │   │                        #  skeleton*, switch, avatar, progress, select, toggle(-group), textarea) + icon.tsx (Phosphor)
    │   └── common/              # Pantalla, BarraRed, EncabezadoPantalla (← Volver), EstadoVacio, EstadoError, PedirSesion,
    │                            # PantallaProximamente, Titulo, MonedaBs, LogoTienda, MonogramaTienda, PlataformaLogo, Velo,
    │                            # BadgeEstadoOutbox (RN09), FilaOpcion (radio 56 px)
    ├── contexts/                # TiendaContext · SesionContext · TemaContext
    ├── lib/
    │   ├── api/                 # cliente-http (apiFetch), contexto-http, errores (ApiError, ErrorSinRed), endpoints,
    │   │                        #  con-cache (lectura con respaldo en configuracion_sync: ventas_json/reservas_json)
    │   ├── db/                  # sqlite-local (SQLite Local + transaccionExclusiva), migraciones v1-v2 (+test), tipos-espejo,
    │   │                        #  repos/{configuracion,espejo,vitrina,carrito,reservas,detalle (nombres de prendas/sucursales),
    │   │                        #  escaner (buscarPorSku), avisos}
    │   ├── outbox/              # OutboxManager: tipos, clasificar-respuesta (+test), repo-outbox, cola-outbox (núcleo puro, +test),
    │   │                        #  outbox-manager (timers/NetInfo/AppState), enviar-operacion, sql-expo, operaciones (las 3 encolables),
    │   │                        #  consultas, conflictos-store, use-outbox, use-motor-outbox
    │   ├── reservas/            # horarios (+test): ventana +30 min/+48 h, 10-20 h La Paz · comprar-reserva (+test): accionPase,
    │   │                        #  ventaDeReserva, codigoPase, momentoRecordatorio, etiquetas
    │   ├── pagos/               # estado-pago (+test): vistaPago, intervaloConsulta (polling), bloqueoPago (RN08), metodosDisponibles ·
    │   │                        #  resumen-clienta (KPIs del dashboard)
    │   ├── notificaciones/      # use-abrir-notificacion (handler en primer plano + tocar el aviso abre `data.ruta`)
    │   ├── vitrina/             # parsear-etiqueta (+test): SKU plano, `mirroria:v:<SKU>` o enlace `?sku=`/`?codigo=`
    │   ├── avisos/              # decidir-avisos (+test, 0→>0 notifica, se re-arma al agotarse), sql-avisos (+test node:sqlite),
    │   │                        #  revisar-avisos (tras cada snapshot: notificación local inmediata)
    │   ├── red/                 # net-info-listener (NetInfoListener), use-estado-red
    │   ├── sesion/              # sesion-store (SecureStore por tienda), jwt (+test)
    │   ├── tema/                # color (+test, port web), derivar-tokens, tema-plataforma, tokens, fuentes, marca.types
    │   ├── formato/             # dinero (+test) "Bs 1.250,00", fechas "hace 5 min"
    │   ├── config.ts            # API_URL, WEB_URL, urlImagen, TTL_ESPEJO_MS (7 días)
    │   └── utils.ts             # cn()
    └── features/
        ├── tiendas/  {api,components,hooks,screens,types}
        ├── auth/     {api,components,hooks,screens,types}
        ├── espejo/   {api,hooks}
        ├── vitrina/  {api,components,hooks,screens}   # + ReservarScreen (cupo, sucursal, horario), EscanearScreen
        │                                        #  (components/escaner: VisorEtiqueta, PermisoCamara, CodigoManual, ResultadoEscaneo; useEscaner)
        ├── avisos/   {components,hooks,screens} # AvisosScreen, FilaAviso, BadgeAviso, QuitarAviso, BannerPermiso; useAvisos,
        │                                        #  useMutacionesAviso, useAvisoVariante, usePermisoNotificaciones
        ├── carrito/  {api,components,hooks,screens}   # carrito (+ agregados sin red, FilaCarritoDeslizable + useQuitarDelCarrito), CheckoutScreen
        ├── pagos/    {api,components,hooks,screens} # PagoScreen (usePago): ResumenPedido, SelectorMetodoPago, PanelQr/PanelCaja/
        │                                        #  PanelMetodo, PiePago, CompraConfirmada, CancelarCompra
        ├── pedidos/  {components,hooks,screens} # MisPedidosScreen, PedidoScreen, TarjetaPedido, BadgeEstadoVenta, useMisVentas/useVenta
        ├── reservas/ {api,components,hooks,screens} # MisReservasScreen, PaseScreen (usePase), PaseQr, DetallesReserva, PieAccionesPase,
        │                                        #  useRecordatorio, useComprarReserva
        ├── mis-cosas/{components,hooks,screens} # dashboard: KpisClienta, ProximaCita, useResumenClienta
        ├── sync/     {components,hooks,screens} # Pendientes, OperacionScreen (comprobante + línea de tiempo), ModalConflictoStock
        └── probador/ {screens}                  # "Próximamente" (Decart en M4)
```
`*` `skeleton.tsx` reescrito con Reanimated (sin clases de pulso de Tailwind).

## 4. Rutas → pantalla → fuente de datos

| Ruta | Pantalla | Datos / endpoints | Estado |
|---|---|---|---|
| `/tiendas` | `TiendasScreen` | `GET /saas/tiendas?limite=50` 🧭 (+ caché `directorio_json`) | M1 ✅ |
| `/acceso/login` · `/acceso/registro` | `LoginScreen` · `RegistroScreen` | `POST /seguridad/auth/login` · `/register` con `X-Tenant` | M1 ✅ |
| `/vitrina` | `VitrinaScreen` | SQLite `catalogo_local` + `v_stock_libre` | M1 ✅ |
| `/vitrina/[productoId]?variante=` | `FichaScreen` | SQLite (variantes + stock por sucursal); "Agregar" → outbox `CARRITO_AGREGAR`; agotada → "Avisame cuando vuelva" (`avisos_local`) | M2 ✅ · M4.2 ✅ |
| `/vitrina/[id]/reservar?variante=` | `ReservarScreen` | SQLite (`reservas.repo`) + `GET /reservas/mias/cupo` (caché `cupo_json:<usuario>`); "Reservar" → outbox `RESERVA_CREAR` | M2 ✅ |
| `/vitrina/reserva/[outboxId]` · `/carrito/compra/[outboxId]` · `/mis-cosas/pendientes/[outboxId]` | `OperacionScreen` | outbox (`outbox_local` + `outbox_eventos`) | M2 ✅ |
| `/vitrina/escanear?codigo=` | `EscanearScreen` | `expo-camera` (QR/Code128) o código escrito → SQLite `variantes_local.sku` → ficha con `?variante=` (sin red también) | M4.1 ✅ |
| `/probador` | `ProbadorScreen` | — | M4 |
| `/carrito` | `CarritoScreen` | `carrito_local` + `CARRITO_AGREGAR` sin confirmar (badge "Pendiente") + aviso de compra en curso; deslizar → "Quitar" (`DELETE /ventas/carrito/:u/items/:v`, solo con red) | M2 ✅ · M4.2 ✅ |
| `/carrito/checkout` | `CheckoutScreen` | SQLite (`stockParaRetiro`) + `POST /promociones/cupones/validar` (solo con red); "Confirmar" → outbox `CHECKOUT` | M2 ✅ |
| `/carrito/pago/[ventaId]` · `/mis-cosas/pago/[ventaId]` | `PagoScreen` | `GET /ventas/:id` (polling) · `GET /pagos/pasarelas` · `POST /pagos/ventas/:id/{qr,sesion,manual,cancelar}` · `GET /pagos/qr/:pagoId` | M3 ✅ |
| `/mis-cosas` | `MisCosasScreen` (dashboard) | `GET /ventas/mias`, `GET /reservas/mias`, cupo (con caché) + espejo | M3 ✅ |
| `/mis-cosas/pendientes` | `PendientesScreen` | outbox + `NetInfoListener` + modo demo "Sin red"; "Sincronizar ahora", "Borrar terminadas" | M2 ✅ |
| `/mis-cosas/pedidos` · `pedidos/[ventaId]` | `MisPedidosScreen` · `PedidoScreen` | `GET /ventas/mias` · `GET /ventas/:id` (+ `CHECKOUT` en la outbox) | M3 ✅ |
| `/mis-cosas/reservas` · `reservas/[reservaId]` | `MisReservasScreen` · `PaseScreen` | `GET /reservas/mias` (+ `RESERVA_CREAR` en la outbox), `GET /reservas/:id` c/15 s, `PATCH …/cancelar`, `POST /ventas/desde-reserva/:id` | M3 ✅ |
| `/mis-cosas/avisos` | `AvisosScreen` | SQLite `avisos_local` + `v_stock_libre` (sin endpoint nuevo) | M4.2 ✅ |

Toda pantalla no raíz tiene `EncabezadoPantalla` con "← Volver" (`router.back()` o la ruta de respaldo).

## 5. Lógica por feature

- **Arranque (`_layout.tsx`):** espera fuentes + `obtenerDb()` (migra con `PRAGMA user_version`) + `NetInfoListener.iniciar()`. El Stack se monta UNA vez (si se desmontara al cambiar de tienda se perdería la navegación).
- **TiendaContext:** tienda + marca en `configuracion_sync` (`tienda_slug`, `tienda_json`) → al reabrir se pinta sin parpadeo. Fija `contextoHttp.tenantSlug` (`X-Tenant`).
- **SesionContext:** una sesión por tienda en SecureStore (`mirroria.sesion.<slug>`); descarta JWT vencidos o de personal; un 401 con sesión la cierra (M2: pausa la cola). Al cambiar de tienda, el token se anula hasta leer el de la nueva.
- **TemaContext:** `/tiendas` (o sin tienda) = MirrorIA y sigue al sistema; el resto = marca de la tienda con su `modo` FIJO. `derivarTemaTienda` (port de la web) → `vars()` de NativeWind en el View raíz (colores "R G B" para que funcione `bg-primary/10`). Radio RECTO 4 · SUAVE 12 · REDONDO 20. Títulos con `Titulo` (fuente de la marca); semánticos `success/warning/danger/info` fijos.
- **auth:** `useLogin/useRegistro` → si `role !== 'CUSTOMER'` lanza `ErrorCuentaPersonal` y **no** guarda el token. Mensajes: 401, 429, 409.
- **espejo:** `useSincronizacionEspejo` (query `['espejo','sync',tiendaId,usuarioId]`): baja sucursales, `?conVariantes=true`, inventario, categorías, tallas y carrito → `reemplazarEspejo` en UNA transacción → invalida `['vitrina']`; también refresca la marca. Disparadores: elegir tienda/login (cambia la clave), reconexión, cada 5 min, pull-to-refresh. Sin red queda en pausa.
- **vitrina:** `useVitrina`/`useFicha` leen solo SQLite (`networkMode: 'always'`). TTL 7 días → `AvisoEspejo` "Datos desactualizados"; nunca sincronizada + sin red → `VitrinaVacia` (CU46 4b). Visitante: `PedirSesion` al agregar/reservar.
- **red:** `online = !modoSinRed && !(isConnected === false || isInternetReachable === false)` (`null` = desconocido). Alimenta `onlineManager`, el cliente HTTP (rechaza antes del `fetch` con `ErrorSinRed`) y `BarraRed`.

- **pagos (M3.1):** `usePago` guarda el cobro iniciado en `configuracion_sync` (`cobro:<ventaId>`: QR, instrucciones de caja o "tarjeta abierta") para que al volver se vea lo mismo. La app nunca da nada por pagado: consulta `GET /ventas/:id` (QR 3 s, tarjeta 4 s, caja 5 s, eligiendo 30 s) y el QR (`GET /pagos/qr/:pagoId`) hasta que el backend acredita (aviso Wayra, webhook Stripe o la cajera en `/admin/cobros`). Al acreditarse: háptico, invalida `ventas`, `reservas` y el espejo. "Pagar en caja" muestra `#` + 8 primeros del id de la venta (lo que ve la cajera; el backend devuelve el id entero). Stripe: `WebBrowser.openBrowserAsync` y al volver se refresca. RN08: sin red todo deshabilitado con motivo; 401 → "Tu sesión venció".
- **pedidos/reservas (M3.2/M3.4):** listas con `conCache` (sin red muestran lo último guardado: el pase sirve sin señal en la tienda); nombres de prenda/sucursal desde SQLite (`detalle.repo`). Pase: QR negro sobre blanco con SOLO el código (D11), `useFocusEffect` + `refetchInterval` 15 s.
- **recordatorio (M3.2):** `expo-notifications` local, trigger DATE 1 h antes (`momentoRecordatorio`), id en `recordatorio:<reservaId>`; se quita solo si la reserva deja de estar PENDIENTE/CONFIRMADA; tocarlo abre el pase (`data.ruta`).
- **comprar lo reservado (M3.3):** `accionPase` decide la primaria: `EN_TIENDA` → "Comprar lo que reservé" (solo con red, cupón opcional, una `Idempotency-Key` por intento) o "Pagar mi compra" si ya hay una `PENDIENTE`; `COMPLETADA` → "Compra pagada · ver pedido".
- **escáner (M4.1, D10):** `useEscaner` con candado (una lectura → una ficha; se libera al volver a enfocar o con "Escanear otra"). `parsearEtiqueta` → `buscarPorSku` (SQLite) → `router.push('/vitrina/[productoId]', {variante})` + háptico Light. No encontrado/código ajeno → `ResultadoEscaneo` con el código leído, la fecha del espejo y "Escanear otra"/"Ver la vitrina". Espejo vacío → "Primero abrí la vitrina con internet". Permiso explicado (o "Abrir ajustes" si se negó para siempre), linterna, "Escribir código". `?codigo=` (deep link) se lee igual que la cámara: sirve para QA (`exp://127.0.0.1:8081/--/vitrina/escanear?codigo=mirroria%3Av%3APANTAL-L-NEG`). Etiquetas de prueba: `uv run scripts/qa/etiquetas_qr.py [--tienda nomada] [--solo-agotadas]` → `scripts/qa/etiquetas/<tienda>/{<SKU>.png,index.html}` (ignorado en git).
- **avisos (M4.2):** por dispositivo y tienda (`avisos_local`, sin FK a `variantes_local` para sobrevivir al reemplazo del espejo; uno por variante). Crear pide el permiso de notificaciones (si se niega, el aviso igual queda y la lista lo muestra). `useSincronizacionEspejo` llama `revisarAvisos` tras cada snapshot (login, reconexión, cada 5 min, pull-to-refresh, CONFIRMADA de la outbox, volver a la app tras > 60 s por `staleTime`): `decidirAvisos` notifica los armados con libre > 0 (`trigger: null`, `data.ruta = /vitrina/<id>?variante=<v>`) y re-arma los ya notificados que volvieron a 0. Expo Go no corre JS en segundo plano: la notificación llega al volver a abrir la app o con ella abierta.
- **deslizar en el carrito (M4.2):** `FilaCarritoDeslizable` (pan propio `usePanGesture` v3 + Reanimated, umbral 48 px o velocidad) descubre "Quitar" (96 px, `danger`); tocarlo → `useQuitarDelCarrito` (DELETE, copia el carrito devuelto a `carrito_local`). Deshabilitado sin red, con unidades "Pendiente" o con una compra en curso; el pie de la lista lo explica.
- **outbox (M2):** ver §6 abajo. Las pantallas que encolan (`useAgregarCarrito`, `useCheckout`, `useReservar`, `useResolverConflicto`) llaman a `lib/outbox/operaciones` y navegan al comprobante (`OperacionScreen`). `useMotorOutbox` (layout raíz) pasa la sesión al manager, invalida `['outbox']`/`['vitrina']` en cada cambio, re-snapshot del espejo tras una CONFIRMADA, háptico Success/Error y abre `ModalConflictoStock` (vía `conflictosStore`).

## 6. Protocolo offline (resumen; detalle en spec §5)

1. SQLite es la fuente de lectura; la red solo refresca el espejo. 2. `v_stock_libre` = snapshot − outbox `PENDIENTE/ENVIANDO`. 3. (M2) `OutboxManager`: siempre se encola, FIFO estricto, `Idempotency-Key` = `Crypto.randomUUID()` guardada una vez. 4. Estados `PENDIENTE · ENVIANDO · CONFIRMADA · COMPENSADA · RECHAZADA`. 5. 409 `STOCK_AGOTADO_CONFLICTO` → `COMPENSADA` + `ModalConflictoStock`; 409 `IDEMPOTENCIA_EN_CURSO` → reintento con la misma clave. 6. 5xx/timeout → backoff 2-4-8-16-30 s. 7. 401 → pausa y reanuda tras login. 8. `ENVIANDO` al arrancar → `PENDIENTE`. 9. El pago nunca es offline (RN08). 10. "Pendiente de confirmar" hasta que el servidor concilia (RN09).

**Implementación M2 (`lib/outbox`):**
- `ColaOutbox` (núcleo puro sobre `BaseSql`, lo usan la app con expo-sqlite y los tests con `node:sqlite`): `encolar` inserta `outbox_local` + `outbox_items` + evento en UNA transacción (id y clave = UUID, `creado_en` estrictamente creciente); `procesar(tenant, usuario, forzar)` toma la cabeza FIFO `PENDIENTE` de esa clienta y tienda → `ENVIANDO` → `enviarOperacion` (mismo cuerpo, misma `Idempotency-Key`) → `clasificarRespuesta`. 2xx: `CONFIRMADA` + `aplicarConfirmacion` (DESCUENTA → `disponible −= n`, RESERVA → `reservada += n`, CHECKOUT vacía `carrito_local`, CARRITO_AGREGAR copia el carrito devuelto). 409 stock: `COMPENSADA` (el stock vuelve solo por `v_stock_libre`) y sigue. Otro 4xx: `RECHAZADA` y sigue. Los dos cancelan lo que sigue de su grupo y cierran `grupo_carrito:<usuario>`. 409 en curso / 5xx / 0 (sin red, timeout): `PENDIENTE`, `reintentos+1`, `proximo_intento_en` con backoff, corta el ciclo. 401 / 403 de tienda: `PENDIENTE` sin contar reintento y pausa.
- `OutboxManager` (singleton): `iniciar()` (ENVIANDO → PENDIENTE, NetInfo, AppState, timer 30 s), `ponerContexto({tenantId, usuarioId, token})` (un token distinto levanta la pausa del 401), `procesarCola(forzar)` con candado + "otra vez", timer de reintento, y si un ciclo falla localmente (SQLite) recupera ENVIANDO y reintenta en 2 s. `reenviarMismaClave` (solo `__DEV__`, deja un evento con HTTP y `X-Cache-Idempotency`). `borrarTerminadas`.
- Migración **v2**: `outbox_local.descripcion`, `outbox_local.meta_json` (prenda, sucursal, líneas, total: no viajan) y `outbox_eventos` (línea de tiempo).
- Grupo: "agregar al carrito" y "confirmar compra" comparten `grupo_carrito:<usuarioId>` (en `configuracion_sync`); el checkout lo cierra.

## 7. Trampas

- **`database is locked` (SQLite)**: `withExclusiveTransactionAsync` abre OTRA conexión; dos a la vez (outbox + re-snapshot del espejo al reconectar) chocan. Toda transacción exclusiva pasa por `transaccionExclusiva()` (`lib/db/sqlite-local.ts`: candado JS + reintento) y la conexión principal tiene `busy_timeout = 5000`.
- **Tests con `node --experimental-strip-types`**: nada de *parameter properties* (`constructor(private x)`) ni `enum` en lo que importan los tests; los imports entre archivos de `lib/outbox` llevan `.ts` (`allowImportingTsExtensions` en `tsconfig`).
- **Rutas tipadas** (`.expo/types`): se regeneran al arrancar Metro; una ruta nueva da error de `tsc` hasta entonces.
- **Metro en WSL** no ve cambios hechos con `sed -i`: editar con el editor/Write. Para recargar desde la PC: `adb shell am force-stop host.exp.exponent` + `am start … exp://127.0.0.1:8081`.
- `KEYCODE_MENU` (82) en MIUI abre "recientes", no el menú de Expo. El botón flotante "Tools" de Expo Go se apaga desde su menú (tapa las capturas).
- **Prohibidas las clases `animate-*`** (nativewind#1875): Skeleton con Reanimated. El warning "ImageBackground is deprecated" (nativewind#1881) es inofensivo.
- `adb shell input text`: el teclado puede pegar campos; los formularios tienen "Siguiente" (Enter pasa al próximo campo). `!` se escapa como `\!`.
- **Modo avión por ADB inalámbrico corta el ADB**: para la demo usar el modo "Sin red" o `adb reverse --remove tcp:3000` (backend inalcanzable).
- Logos `/images/*` necesitan el frontend Docker + `adb reverse tcp:8080 tcp:80`; si no cargan se muestra el monograma.
- `react-native-reusables` trae clases `dark:` y de animación web: se quitaron (los colores salen de los tokens, no del esquema del sistema).
- React Compiler **desactivado** en `app.json` (la plantilla 58 lo trae activo) para no mezclarlo con css-interop de NativeWind.
- **Expo Go 58 + `setNotificationChannelAsync`** tira `NullPointerException` nativo: el recordatorio cae al canal por defecto (funciona igual).
- **Teclado:** `tabBarHideOnKeyboard` en las tabs y `keyboardShouldPersistTaps="handled"` en los ScrollView con input (si no, el primer toque a "Aplicar" solo cierra el teclado).
- **Chrome primer arranque** en el POCO: la Custom Tab de Stripe abre la bienvenida de Chrome y Expo Go puede volver a su inicio; reabrir con deep link `exp://127.0.0.1:8081/--/mis-cosas/pago/<ventaId>` (el cobro quedó en SQLite).
- **JWT de 1 h**: tras una pausa larga la sesión vence (401); la app la descarta al arrancar y el pago muestra "Tu sesión venció".
- **Expo Go 58.0.5 se cae al TOCAR una notificación local** (`LauncherActivity`: `IllegalStateException: Cannot access database on the main thread`, nativo de Expo Go): termina en el escritorio. La notificación SÍ se muestra; la ruta de `data.ruta` se verificó por deep link. Afecta también al recordatorio de M3. Revisar en el *development build*/APK (M4.3).
- **`ReanimatedSwipeable` (RNGH 3.3) dibujaba las acciones en el flujo** (arriba e izquierda de la fila) en esta app: se reemplazó por un pan propio (`FilaCarritoDeslizable`) con la acción en `style` absoluto.
- **Fast Refresh recrea el `QueryClient`** de `_layout.tsx` si se edita un módulo de su cadena: las mutaciones invalidan un caché sin observadores y la UI "no se actualiza". Antes de dar por roto algo de datos, `am force-stop` y reabrir.
- **Deep link con el mismo `?codigo=`** a una pantalla ya abierta no re-dispara el efecto (el parámetro no cambió): reabrir la app en frío o usar otro código.
- **Volver a la app por "recientes"**: Expo Go tiene dos tareas (la experiencia y su `HomeActivity`); para reanudar sin adivinar coordenadas usar `am start -d exp://127.0.0.1:8081/--/<ruta>`.
- M4: tras `expo prebuild`, `android/gradle.properties` con `org.gradle.workers.max=2` y `reactNativeArchitectures=arm64-v8a` (RAM).

## 8. Checklist QA (spec §8.5)

`tsc` · `expo lint` · `expo-doctor` (20/20) · `npm test` (55: migraciones, outbox, clasificación, horarios, formato, jwt, color, estado-pago, KPIs, comprar-reserva, **parsear-etiqueta, decidir-avisos, sql-avisos**) limpios; `grep -rn "lucide\|animate-" src` vacío; ningún componente propio > 120 líneas (los primitivos RNR `select/dialog/alert-dialog` se dejan como vienen); ninguna referencia a `/ventas/presenciales`, `/pagos/pendientes`, `/dashboard/operativo`; recorrer cada ruta y su "← Volver"; capturas del POCO en `docs/capturas/`.
