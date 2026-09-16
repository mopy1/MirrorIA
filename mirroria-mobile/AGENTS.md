# 📱 MirrorIA Mobile — Arquitectura, Guía Técnica y Árbol de Carpetas

Este documento define la arquitectura técnica, las directrices de diseño y la estructura de carpetas de `mirroria-mobile`.
Cualquier agente IA o desarrollador que trabaje en esta base de código **DEBE** seguir estas directrices de forma obligatoria.

---

## 🎯 Alcance Estricto: Exclusivo para Clientas (`CUSTOMER`)
- **La aplicación móvil es EXCLUSIVAMENTE para clientas compradoras (`CUSTOMER`).**
- **Bajo ninguna circunstancia se debe implementar panel o módulos de administración en móvil.**
- Las funciones administrativas (gestión de productos, stock, sucursales, reportes y usuarios) pertenecen de forma exclusiva al frontend web (`mirroria-frontend` en `/admin`).

---

## 🌟 Estrategia de Producto Móvil vs Web (Enfoque Diferenciado)

La app móvil **NO es un clon reducido de la tienda web**. Se diseñó como un **asistente personal de moda de bolsillo** que explota las capacidades táctiles y de movilidad del smartphone:

| Dimensión | Web (`mirroria-frontend`) | Móvil (`mirroria-mobile`) |
|---|---|---|
| **Propósito Principal** | Compras con calma, filtros densos y administración completa del negocio. | Probarse ropa en 3D, navegación táctil rápida y pase físico en sucursal. |
| **Experiencia de Catálogo** | Cuadrícula e-commerce con filtros laterales de atributos y tablas. | Feed editorial para el pulgar con botón de un toque **"🪞 Probar en 3D"**. |
| **Probador Virtual** | Informativo / complementario. | **Feature Estrella Central:** rotación 360° táctil, zoom gestual y cambio de variantes en vivo. |
| **Sucursales Físicas** | Consulta de mapa y horarios. | **Pase de Tienda:** Códigos de cita de prueba física en mano para mostrar al encargado/cajero. |

---

## 🧭 Arquitectura de Navegación Móvil (Bottom Tabs)

La app organiza la experiencia de la clienta en **4 pestañas inferiores fijas**, con el Vestidor 3D como botón central destacado:

1. **🏠 Feed (`/feed`):** Novedades, tendencias y colecciones de temporada con estética de revista boutique.
2. **👗 Catálogo (`/catalogo`):** Vitrina visual optimizada para pulgar, con buscador rápido, filtro de categorías y badge dinámico de disponibilidad por sucursal física.
3. **🪞 Vestidor 3D (`/probador` - Botón Central Destacado):** Visor interactivo WebGL/Three.js donde la clienta rota prendas `.glb`, examina caída de tela y cambia tallas/colores en tiempo real.
4. **👤 Perfil & Reservas (`/perfil`):** Credenciales de la clienta, historial de pedidos y **Pase de Tienda** con las citas activas para probarse prendas en sucursal.

---

## 🛠️ Stack Tecnológico
- **Framework:** Expo SDK 57 + React Native 0.86.x + React 19 (subido desde SDK 56 el 2026-09-14, ver sección de troubleshooting al final de este documento — **si tu Expo Go del celular no está actualizado a la versión que corresponde a SDK 57, la conexión falla con un error de incompatibilidad**, no es un bug del proyecto).
- **Routing:** Expo Router (File-based navigation con grupos y layouts).
- **Styling:** NativeWind v4 (Tailwind CSS v3 compilado para React Native).
- **Design System / Componentes:** React Native Reusables (RNR / `@rn-primitives`) + Lucide Icons (`lucide-react-native`).
- **Formularios y Validación:** React Hook Form + Zod + `@hookform/resolvers`.
- **Almacenamiento Seguro:** `expo-secure-store` con fallback transparente a `localStorage` para web.
- **Networking:** `fetch` tipado con cliente unificado (`src/lib/api.ts`) que resuelve automáticamente la IP del host de Expo (`Constants.expoConfig?.hostUri`) para pruebas en celular físico mediante QR (Expo Go).

---

## 🎨 Identidad Visual y Paleta (Consistente con `mirroria-frontend`)
- **Acento Primario (Vino/Rosa Profundo):**
  - Modo Claro: `hsl(348 65% 26%)` / `oklch(0.38 0.16 15)`
  - Modo Oscuro: `hsl(348 70% 60%)` / `oklch(0.68 0.17 15)`
  - Anillo de Foco: `hsl(348 60% 45%)`
- **Tema Visual Fijo (Siempre Claro / Blanco):** Por directriz de marca boutique, la aplicación móvil opera permanentemente en modo claro (`light`). Se desactivó el modo oscuro en Expo (`userInterfaceStyle: "light"` en `app.json`), NativeWind (`setColorScheme('light')` en `_layout.tsx`) y se retiró el botón de alternancia del encabezado, garantizando una vitrina luminosa, limpia y consistente en cualquier teléfono.
- **Radio de Bordes Unificado:** `--radius: 0.75rem` (12px, Shape Consistency Lock).
- **Tipografía y Legibilidad:** Componentes nativos accesibles provistos por RNR (`Text`, `Label`, `Button`, `Card`, `Input`).

---

## 📁 Arquitectura de Carpetas Real y Componentes Modulares

```
mirroria-mobile/
├── AGENTS.md                         # Este documento de arquitectura
├── app/                              # Rutas del Expo Router
│   ├── _layout.tsx                   # Root Layout (AuthProvider + ThemeProvider + PortalHost)
│   ├── index.tsx                     # Redirección inmediata a /(tabs)
│   ├── +not-found.tsx                # Pantalla 404
│   ├── +html.tsx                     # Template HTML para compilación web
│   ├── (auth)/                       # Grupo de rutas de autenticación
│   │   ├── _layout.tsx               # Stack sin header para auth
│   │   ├── login.tsx                 # Ruta /login
│   │   └── register.tsx              # Ruta /register
│   │
│   └── (tabs)/                       # 🧭 Barra de navegación inferior
│       ├── _layout.tsx               # Tab bar con botón central destacado para Vestidor 3D
│       ├── index.tsx                 # 🏠 Pestaña Feed (Novedades y colecciones)
│       ├── catalogo.tsx              # 👗 Pestaña Catálogo (Vitrina táctil y stock)
│       ├── probador.tsx              # 🪞 Pestaña Vestidor 3D (Botón central destacado)
│       └── perfil.tsx                # 👤 Pestaña Perfil & Reservas (Pase de tienda)
│
├── components/                       # Sistema de diseño y componentes UI compartidos
│   ├── brand-logo.tsx                # Logotipo boutique MirrorIA unificado con web
│   ├── common/                       # Componentes compartidos de navegación y estructura
│   │   ├── AnimatedTabBar.tsx        # Dock flotante con cápsula deslizante y física de resorte (spring)
│   │   ├── ScreenHeader.tsx          # Cabecera boutique con BrandLogo y fondo blanco fijo
│   │   └── TabBarIcon.tsx            # Icono auxiliar tipado con soporte de badges
│   │
│   └── ui/                           # Primitivos React Native Reusables (RNR)
│       ├── badge.tsx                 # Badge modular con variantes de color
│       ├── button.tsx                # Botón con variantes (default, outline, ghost, etc.)
│       ├── card.tsx                  # Tarjeta modular (Header, Title, Description, Content, Footer)
│       ├── icon.tsx                  # Wrapper de Lucide con soporte NativeWind
│       ├── input.tsx                 # Campo de texto estilizado
│       ├── label.tsx                 # Etiqueta accesible (@rn-primitives/label)
│       └── text.tsx                  # Tipografía responsiva
│
├── src/                              # Código fuente de negocio modular
│   ├── context/                      # Contextos globales de la app
│   │   ├── auth-context.ts           # Definición de interfaz y objeto AuthContext
│   │   └── AuthContext.tsx           # Proveedor AuthProvider con persistencia segura
│   │
│   ├── hooks/                        # Hooks compartidos
│   │   ├── useAuth.ts                # Consumo de sesión de usuario
│   │   └── useKeyboard.ts            # Detección y animación suave de altura del teclado nativo
│   │
│   ├── lib/                          # Utilidades e infraestructura
│   │   ├── api.ts                    # Cliente HTTP con interceptor JWT e IP adaptativa
│   │   ├── money.ts                  # Formateador de moneda boliviana (BOB / Bs)
│   │   ├── storage.ts                # Almacenamiento seguro multiplataforma (SecureStore + web)
│   │   ├── theme.ts                  # Definición de temas claro/oscuro para React Navigation
│   │   └── utils.ts                  # Helper cn() (clsx + tailwind-merge)
│   │
│   └── features/                     # Módulos de dominio de negocio (UI 100% modular)
│       ├── auth/                     # ✅ Feature de Autenticación
│       │   ├── api/authApi.ts        # Endpoints NestJS (/seguridad/auth/*)
│       │   ├── types/auth.types.ts   # DTOs y tipos de usuario
│       │   ├── hooks/{useLogin,useRegister}.ts
│       │   ├── components/{LoginForm,RegisterForm}.tsx
│       │   └── screens/{LoginScreen,RegisterScreen}.tsx
│       │
│       ├── feed/                     # 🏠 Feature de Feed y Portada Boutique
│       │   ├── components/HeroBanner.tsx       # Banner editorial con degradé y CTA
│       │   ├── components/QuickActionsBar.tsx  # Accesos rápidos táctiles
│       │   ├── components/FeaturedCarousel.tsx # Carrusel de prendas con 3D
│       │   ├── components/StorePassTeaser.tsx  # Teaser de Pase de Tienda
│       │   └── screens/FeedScreen.tsx          # Pantalla orquestadora (< 80 líneas)
│       │
│       ├── catalog/                  # 👗 Feature de Catálogo Táctil y Novedades
│       │   ├── api/catalogApi.ts     # GET /catalogo/productos y /catalogo/categorias
│       │   ├── types/catalog.types.ts# Tipos de prendas, categorías y variantes
│       │   ├── components/SearchInput.tsx        # Buscador con botón limpiar
│       │   ├── components/CategoryChips.tsx      # Chips horizontales de categorías
│       │   ├── components/ProductCardMobile.tsx  # Tarjeta boutique con imagen, 3D badge y Bs
│       │   ├── components/CatalogSkeleton.tsx    # Esqueleto de carga
│       │   ├── components/CatalogEmptyState.tsx  # Estado vacío con reseteo
│       │   └── screens/CatalogScreen.tsx         # Pantalla orquestadora (< 130 líneas)
│       │
│       ├── virtual-fitting/          # 🪞 Feature Estrella: Vestidor 3D
│       │   ├── components/FittingRoomHeader.tsx   # Título y badge de estado
│       │   ├── components/FittingStagePreview.tsx # Maniquí, visor 360°, podio e iluminación
│       │   ├── components/GarmentSelectorBar.tsx  # Selector horizontal de prendas para probar
│       │   ├── components/FittingActionRow.tsx    # Tallas (XS-XL) y botón de pase en tienda
│       │   └── screens/FittingRoomScreen.tsx      # Pantalla orquestadora (< 80 líneas)
│       │
│       └── profile/                  # 👤 Feature de Perfil y Pase de Tienda
│           ├── components/ProfileHeader.tsx          # Avatar con iniciales y rol CLIENTA
│           ├── components/GuestPromptCard.tsx        # Invitación a crear cuenta para invitadas
│           ├── components/StorePassCard.tsx          # Tarjeta digital con QR de cita en tienda
│           ├── components/ProfileNavigationMenu.tsx  # Menú de pedidos, medidas y sucursales
│           └── screens/ProfileScreen.tsx             # Pantalla orquestadora (< 40 líneas)
│
├── assets/                           # Iconos, splash screen e imágenes
├── global.css                        # Tokens CSS Tailwind y variables HSL
├── tailwind.config.js                # Configuración de NativeWind y rutas de contenido
├── app.json                          # Configuración Expo de la aplicación
└── package.json                      # Dependencias del proyecto
```

---

## 🌐 Conexión con el Backend NestJS (`mirroria-backend`)
- Los endpoints consumidos son:
  - `POST /api/v1/seguridad/auth/login`
  - `POST /api/v1/seguridad/auth/register`
  - `GET /api/v1/seguridad/auth/me`
  - `GET /api/v1/catalogo/productos`
  - `GET /api/v1/catalogo/categorias`
- **Conectividad Móvil Global (Cloudflare Tunnel):**
  - Para evitar bloqueos de red local o Wi-Fi, la API se publica mediante Cloudflare Tunnel (`cloudflared tunnel --url http://localhost:3000`).
  - La URL pública encriptada HTTPS se inyecta en `src/lib/api.ts` y `.env`, permitiendo que cualquier celular físico (Android o iOS) consuma la API en tiempo real mediante Expo Go o navegador web.

---

## 🔧 Troubleshooting real (2026-09-14): bugs que solo pasaban en celular con Expo Go, nunca en la vista web

### Síntoma reportado por el usuario
Dos bugs reproducibles **únicamente** abriendo la app en un celular físico vía Expo Go (túnel de Cloudflare para el backend + `expo start --tunnel` para Metro). En `npm run web` (navegador) todo funcionaba perfecto:
1. El círculo animado de `AnimatedTabBar.tsx` no quedaba centrado bajo el ícono de la pestaña seleccionada.
2. En la pestaña Catálogo, filtrar por la categoría "Accesorios" dejaba la app sin responder (freeze/ANR).

### Pregunta clave del usuario: ¿es Expo Go el que está mal, o la app?
**Ninguno de los dos literalmente "está roto" — el proyecto tenía 3 dependencias nativas desalineadas respecto al Expo SDK que declaraba usar**, confirmado con `npx expo-doctor` (no es una suposición, es un diagnóstico verificable con esa herramienta oficial). Los tres bugs viven en la capa **nativa** (Hermes, módulos nativos vía autolinking), que la vista web (`react-native-web`, corre en el motor JS del navegador) se salta por completo — por eso el síntoma era 100% exclusivo del dispositivo físico.

Hallazgos exactos de `expo-doctor` antes del fix:
1. **`react-native-screens` duplicado**: `4.25.2` (raíz del proyecto) convivía con `4.27.0` (anidado dentro de `node_modules/expo-router`). Dos copias del módulo nativo de navegación compilando en el mismo build puede desincronizar medidas/layout de las pantallas nativas (candidato fuerte para el bug del círculo del tab bar, que depende de medir el layout real de cada pestaña).
2. **Regresión de memoria conocida en Hermes V1** (`250829098.0.10`, afecta a toda versión ≤ `.15`) para exactamente esta build de Expo SDK 56 — bug documentado por el propio equipo de Expo, arreglado recién en `.16`. Hermes es el motor JS que corre **solo en el build nativo** (Expo Go); la web usa el motor del navegador. Candidato fuerte para el freeze de "Accesorios".
3. **`expo-secure-store` en versión mayor incompatible**: `package.json` tenía `^57.0.4` (pensado para el próximo SDK) contra un proyecto en SDK 56, que esperaba `~56.0.4`. En web, `expo-secure-store` ni siquiera toca código nativo (usa un shim), por eso ahí nunca se manifestaba.

### Fix aplicado (solo dependencias — **cero cambios de código de la app**, a pedido explícito del usuario)
```bash
npx expo install --fix        # alineó expo-secure-store y react-native-screens al SDK vigente
npm dedupe                     # colapsó las dos copias de react-native-screens en una sola
npx expo install expo@^57.0.9 --fix   # upgrade completo a Expo SDK 57 (única forma real de arreglar el bug de Hermes)
```
Resultado: `expo-doctor` pasó de 19/22 a **21/21 checks**. `tsc --noEmit` limpio. Verificado además con Playwright contra `npm run web` (0 errores de consola, mismos warnings preexistentes de siempre) tras el upgrade — sin regresiones visibles en la vista web.

**Versiones clave después del upgrade:** `expo@57.0.22`, `react-native@0.86.3`, `react-native-screens@4.26.2` (única copia), `react-native-reanimated@4.5.1`, `react-native-worklets@0.10.1`, `expo-secure-store@~57.0.4`, y el resto de paquetes `expo-*` realineados a `~57.x`.

> [!IMPORTANT]
> **Acción manual pendiente del lado del usuario, no resoluble desde el repo:** hay que actualizar la app **Expo Go** en el celular físico (Play Store / App Store) a la versión que soporta SDK 57. Con el Expo Go viejo (SDK 56), escanear el QR tira un error de incompatibilidad — es el comportamiento esperado del upgrade, no un bug nuevo.

### Bug de código real encontrado pero NO corregido (a pedido explícito del usuario, queda pendiente)
Durante la investigación se detectó que `ImagenProducto.esPrincipal` (usado en `ProductCardMobile.tsx`, `GarmentSelectorBar.tsx` y `FeaturedCarousel.tsx` vía `imagenes?.find((img) => img.esPrincipal)`) **es un campo que nunca existió en el backend real** — el DTO de `mirroria-backend` y el tipo de `mirroria-frontend` usan `esArAsset`, no `esPrincipal` (ver `mirroria-backend/AGENTS.md`, sección de `catalogo`). Como `.find()` siempre devuelve `undefined` para ese campo inexistente, el código cae siempre al fallback `imagenes?.[0]?.url` — funciona por accidente (no rompe nada visualmente hoy), pero ignora el campo real `orden` que indica cuál imagen es la principal. Se llegó a implementar y verificar un fix (tipo corregido a `esArAsset` + helper `getPrimaryImageUrl` que ordena por `orden`), pero **se revirtió a pedido del usuario** ("dejalo como estaba, sin tus modificaciones de código") para no arriesgar nada que ya andaba bien en la web mientras se resolvían las dependencias. **Si se retoma:** el fix correcto es ordenar `imagenes` por `orden` ascendente y tomar la primera, no buscar un campo `esPrincipal` que no existe. Revisar los 3 archivos mencionados arriba.

### Lección general para cualquier bug futuro de este estilo en el proyecto
Si un bug **solo** se reproduce en Expo Go/dispositivo físico y **nunca** en `npm run web`, sospechar primero de desalineación de dependencias nativas (`npx expo-doctor` es el primer comando a correr, no leer código a ciegas) antes de asumir que es un bug de lógica JS — la vista web de Expo Router se salta Hermes, autolinking de módulos nativos, y la capa de `react-native-screens`/navegación nativa por completo, así que cualquier bug que dependa de esas capas es invisible ahí por diseño, no porque "la web tape el bug".

---

## 🚇 Troubleshooting de Conectividad Móvil y Túneles (2026-09-15)

### Síntoma: `CommandError: failed to start tunnel: session closed / remote gone away`
Al ejecutar `npx expo start --tunnel`, el proceso falla abruptamente con `session closed` y remite a la página de estado de ngrok.

### Causa Raíz Investigada y Verificada
1. **Token compartido saturado en Ngrok:** Expo CLI tiene quemado en su código (`AsyncNgrok.ts`) un token corporativo general (`5W1bR67GNbWcXqmxZzBG1_56GezNeaX6sSRvn8npeQ8`, dominio `exp.direct`) compartido con todos los desarrolladores de Expo del mundo.
2. Al ejecutar con `DEBUG=expo*`, ngrok respondió exactamente:
   ```text
   ERR_NGROK_108: Your account is limited to 5000 simultaneous ngrok agent sessions.
   ```
   En horas pico, los desarrolladores a nivel global superan las 5.000 sesiones simultáneas de la cuenta comunitaria de Expo, provocando que ngrok cierre la conexión remota de inmediato.
3. El comando `ngrok` tampoco existe globalmente en el `PATH` del sistema (solo el binario interno de Expo en `node_modules`).

### Soluciones Validadas para Desarrollar
1. **Modo LAN (Recomendada y 100% estable):** Si la PC y el teléfono están en la misma red Wi-Fi, no se necesita túnel alguno:
   ```bash
   npm run dev
   # o: npx expo start --lan
   ```
   Genera directamente la URL local `exp://<IP_LOCAL>:8081` con carga instantánea y sin pasar por intermediarios.
2. **Túnel Oficial V2 de Expo (Sin Ngrok):** Expo posee un motor WebSocket propio (`@expo/ws-tunnel`) independiente de ngrok:
   ```bash
   npx expo login
   EXPO_UNSTABLE_TUNNEL_V2=1 npx expo start --tunnel
   ```
3. **Authtoken personal de Ngrok:** Registrar un token gratuito propio en `~/.ngrok2/ngrok.yml` si se requiere exponer túneles directos.
