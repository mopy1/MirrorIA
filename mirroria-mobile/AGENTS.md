# 📱 mirroria-mobile — App móvil de MirrorIA (Nivel 3)

> **App solo para clienta (`CUSTOMER`) y visitante. Sin punto de venta.** Las cuentas de personal
> (`ADMIN`, `ENCARGADO_SUCURSAL`, `CAJERO`, `DUENO_PLATAFORMA`) se rechazan en el login: "usala en la web".
> Spec cerrada: vault `U/2-2026/SI2/Parcial2/Movil_Spec.md` (manda sobre este archivo). Plan: `Plan_Movil.md`.
> Estado: **M0 + M1 hechos** (scaffold, tema, acceso, espejo SQLite, vitrina/ficha offline). Pendiente: M2 (outbox), M3 (pagos/reservas), M4 (escáner, avisos, Decart).

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
| Instalado para fases futuras | `expo-camera`, `expo-notifications`, `expo-haptics` (ya en uso), `expo-web-browser`, `react-native-qrcode-svg` |
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
├── docs/capturas/m1/            # capturas del POCO para el PDF
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
    │       └── mis-cosas/{index, pedidos, reservas, pendientes, avisos}
    ├── components/
    │   ├── ui/                  # RNR (button, text, card, badge, input, label, dialog, alert-dialog, tabs, separator,
    │   │                        #  skeleton*, switch, avatar, progress, select, toggle(-group), textarea) + icon.tsx (Phosphor)
    │   └── common/              # Pantalla, BarraRed, EncabezadoPantalla (← Volver), EstadoVacio, EstadoError, PedirSesion,
    │                            # PantallaProximamente, Titulo, MonedaBs, LogoTienda, MonogramaTienda, PlataformaLogo, Velo
    ├── contexts/                # TiendaContext · SesionContext · TemaContext
    ├── lib/
    │   ├── api/                 # cliente-http (apiFetch), contexto-http, errores (ApiError, ErrorSinRed), endpoints
    │   ├── db/                  # sqlite-local (SQLite Local), migraciones (+test), tipos-espejo, repos/{configuracion,espejo,vitrina,carrito}
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
        ├── vitrina/  {components,hooks,screens}
        ├── carrito/  {api,components,hooks,screens}
        ├── mis-cosas/{components,screens}
        ├── sync/     {components,screens}       # Pendientes + modo demo "Sin red" (outbox en M2)
        └── probador/ {screens}                  # "Próximamente" (Decart en M4)
```
`*` `skeleton.tsx` reescrito con Reanimated (sin clases de pulso de Tailwind).

## 4. Rutas → pantalla → fuente de datos

| Ruta | Pantalla | Datos / endpoints | Estado |
|---|---|---|---|
| `/tiendas` | `TiendasScreen` | `GET /saas/tiendas?limite=50` 🧭 (+ caché `directorio_json`) | M1 ✅ |
| `/acceso/login` · `/acceso/registro` | `LoginScreen` · `RegistroScreen` | `POST /seguridad/auth/login` · `/register` con `X-Tenant` | M1 ✅ |
| `/vitrina` | `VitrinaScreen` | SQLite `catalogo_local` + `v_stock_libre` | M1 ✅ |
| `/vitrina/[productoId]` | `FichaScreen` | SQLite (variantes + stock por sucursal); "Agregar" = `POST /ventas/carrito/:id/items` online | M1 ✅ |
| `/vitrina/escanear` · `/vitrina/[id]/reservar` | placeholders | — | M4 · M3 |
| `/probador` | `ProbadorScreen` | — | M4 |
| `/carrito` | `CarritoScreen` | SQLite `carrito_local` (lo baja el espejo) | M1 lectura; checkout M2 |
| `/mis-cosas` | `MisCosasScreen` | sesión + estado del espejo | M1 ✅ |
| `/mis-cosas/pendientes` | `PendientesScreen` | `NetInfoListener` + `configuracion_sync.modo_sin_red` | M1 (outbox M2) |
| `/mis-cosas/{pedidos,reservas,avisos}` | placeholders | — | M3 · M3 · M4 |

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

## 6. Protocolo offline (resumen; detalle en spec §5)

1. SQLite es la fuente de lectura; la red solo refresca el espejo. 2. `v_stock_libre` = snapshot − outbox `PENDIENTE/ENVIANDO`. 3. (M2) `OutboxManager`: siempre se encola, FIFO estricto, `Idempotency-Key` = `Crypto.randomUUID()` guardada una vez. 4. Estados `PENDIENTE · ENVIANDO · CONFIRMADA · COMPENSADA · RECHAZADA`. 5. 409 `STOCK_AGOTADO_CONFLICTO` → `COMPENSADA` + `ModalConflictoStock`; 409 `IDEMPOTENCIA_EN_CURSO` → reintento con la misma clave. 6. 5xx/timeout → backoff 2-4-8-16-30 s. 7. 401 → pausa y reanuda tras login. 8. `ENVIANDO` al arrancar → `PENDIENTE`. 9. El pago nunca es offline (RN08). 10. "Pendiente de confirmar" hasta que el servidor concilia (RN09).

## 7. Trampas

- **Metro en WSL** no ve cambios hechos con `sed -i`: editar con el editor/Write. Para recargar desde la PC: `adb shell am force-stop host.exp.exponent` + `am start … exp://127.0.0.1:8081`.
- `KEYCODE_MENU` (82) en MIUI abre "recientes", no el menú de Expo. El botón flotante "Tools" de Expo Go se apaga desde su menú (tapa las capturas).
- **Prohibidas las clases `animate-*`** (nativewind#1875): Skeleton con Reanimated. El warning "ImageBackground is deprecated" (nativewind#1881) es inofensivo.
- `adb shell input text`: el teclado puede pegar campos; los formularios tienen "Siguiente" (Enter pasa al próximo campo). `!` se escapa como `\!`.
- **Modo avión por ADB inalámbrico corta el ADB**: para la demo usar el modo "Sin red" o `adb reverse --remove tcp:3000` (backend inalcanzable).
- Logos `/images/*` necesitan el frontend Docker + `adb reverse tcp:8080 tcp:80`; si no cargan se muestra el monograma.
- `react-native-reusables` trae clases `dark:` y de animación web: se quitaron (los colores salen de los tokens, no del esquema del sistema).
- React Compiler **desactivado** en `app.json` (la plantilla 58 lo trae activo) para no mezclarlo con css-interop de NativeWind.
- M4: tras `expo prebuild`, `android/gradle.properties` con `org.gradle.workers.max=2` y `reactNativeArchitectures=arm64-v8a` (RAM).

## 8. Checklist QA (spec §8.5)

`tsc` · `expo lint` · `expo-doctor` · `npm test` limpios; `grep -rn "lucide\|animate-" src` vacío; ningún componente propio > 120 líneas (los primitivos RNR `select/dialog/alert-dialog` se dejan como vienen); ninguna referencia a `/ventas/presenciales`, `/pagos/pendientes`, `/dashboard/operativo`; recorrer cada ruta y su "← Volver"; capturas del POCO en `docs/capturas/`.
