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
│       ├── virtual-fitting/          # 🪞 Feature Estrella: Vestidor 3D — AR en vivo (ver sección dedicada abajo)
│       │   ├── components/
│       │   │   ├── CameraStage/                  # Orquestador: cámara en vivo + overlays + captura de prueba
│       │   │   │   ├── CameraStage.tsx           # Cámara, toggle 2D/3D, selector de prenda 3D, expandir, flip
│       │   │   │   ├── CameraControls.tsx        # Botones flotantes: agrandar/achicar, cambiar cámara
│       │   │   │   ├── CameraPermissionGate.tsx  # Pantalla cuando no hay permiso de cámara
│       │   │   │   ├── CaptureControls.tsx       # Temporizador + botón de captura
│       │   │   │   ├── CountdownOverlay.tsx      # Cuenta regresiva antes de capturar
│       │   │   │   └── PhotoReviewModal.tsx      # Preview de la foto de prueba tomada
│       │   │   ├── PoseOverlay/                  # Puntos de pose animados sobre la cámara
│       │   │   │   ├── PoseOverlay.tsx
│       │   │   │   └── PoseDot.tsx               # View simple con borderRadius (SVG no sobrevivía a las capturas)
│       │   │   ├── GarmentOverlay/GarmentOverlay.tsx  # Sprite 2D de la prenda siguiendo hombros
│       │   │   ├── GarmentScene3D/               # Modelo 3D real (.glb) siguiendo el cuerpo
│       │   │   │   ├── GarmentScene3D.tsx        # <Canvas> ortográfica, 1 unidad = 1px
│       │   │   │   └── GarmentModel.tsx          # Carga el glb, mide hombros, aplica transform por cuadro
│       │   │   ├── FittingRoomHeader.tsx         # Título y badge de estado
│       │   │   ├── GarmentSelectorBar.tsx        # Selector horizontal de prendas del catálogo (aún no conectado al 3D)
│       │   │   └── FittingActionRow.tsx          # Tallas (XS-XL) y botón de pase en tienda
│       │   ├── hooks/
│       │   │   ├── useCameraPermission.ts        # Wrapper del hook de permisos de VisionCamera
│       │   │   ├── usePoseLandmarks.ts           # Conecta el frame processor nativo, expone landmarks (shared value)
│       │   │   ├── useRemoteGarmentSize.ts       # Mide el tamaño real de `arOverlayImageUrl` (Image.getSize)
│       │   │   └── useTimedCapture.ts            # Temporizador + captura de foto de prueba
│       │   ├── lib/
│       │   │   ├── landmarkMath.ts               # Toda la matemática (transform 2D y 3D), sin nada de UI
│       │   │   ├── garmentAnchor.ts              # Convención de anclaje para PNGs subidos por el admin
│       │   │   └── testGarments.ts               # PNG de prueba para el sprite 2D
│       │   ├── types/pose.types.ts               # Índices de landmarks (esquema MediaPipe/BlazePose, 33 puntos)
│       │   └── screens/FittingRoomScreen.tsx      # Pantalla orquestadora
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

## 🪞 Vestidor 3D — Arquitectura real del probador AR (implementado 2026-09-22)

La tabla de la sección "Estrategia de Producto" de arriba describe la visión; esto describe
**lo que realmente hay implementado y corriendo hoy**: AR en vivo con cámara real, sin ningún
mockup — la clienta abre la pestaña, ve su propia cámara, el sistema detecta su cuerpo en
tiempo real, y una prenda (sprite 2D o modelo 3D `.glb`) se superpone siguiendo sus hombros.
Android-first a propósito (ver Fase 6 pendiente al final).

### Pipeline, de la cámara a la pantalla

```
<Camera> (VisionCamera)
  → useFrameOutput({ pixelFormat: 'yuv' })          [hooks/usePoseLandmarks.ts]
  → mirroriaPoseDetector.processFrameAndroid(frame)  [módulo nativo Kotlin, ver abajo]
  → 33 landmarks (x, y, z, visibility) — esquema MediaPipe/BlazePose
  → landmarks: SharedValue<PoseLandmark[]>           (actualizado desde un worklet, sin pasar por React)
  → GarmentOverlay (2D, useAnimatedStyle)  o  GarmentScene3D → GarmentModel (3D, useFrame)
  → computeGarmentTransform / computeGarmentTransform3D   [lib/landmarkMath.ts — toda la matemática vive acá]
```

### Decisiones de stack y el porqué (no son la opción obvia)

- **Cámara: `react-native-vision-camera` v5 ("Nitro"), no `expo-camera`.** `expo-camera` no tiene
  frame processors — no puede entregarte frames crudos para correr un modelo de IA por-frame.
- **Worklets: usa `react-native-worklets` (el mismo de Reanimated 4), NUNCA
  `react-native-worklets-core`.** Ambos registran la misma clase `WorkletsPackage` en Android —
  instalar los dos rompe el build de Gradle. Casi todos los wrappers comunitarios de
  pose-detection que existen en npm dependen del paquete viejo (`-core`), así que quedan
  descartados de entrada para este proyecto.
- **Detección de pose: módulo nativo propio (`modules/mirroria-pose-detector/`, Nitro Module en
  Kotlin) envolviendo `com.google.mlkit:pose-detection:18.0.0-beta5`, no un paquete de npm.** No
  existe ningún wrapper de React Native maduro para MediaPipe Tasks Vision ni para ML Kit
  compatible con VisionCamera v5 — VisionCamera documenta oficialmente escribir tu propio Frame
  Processor Plugin nativo, así que eso se hizo. Sigue siendo literalmente "los puntos de Google"
  (ML Kit), con menos plomería nativa que MediaPipe Tasks (que además exige empaquetar su propio
  runtime TFLite).
  - `processFrameAndroid` corre **síncrono a propósito**
    (`Tasks.await(poseDetector.process(...), 800, TimeUnit.MILLISECONDS)`): el `ImageProxy` del
    frame deja de ser válido apenas el worklet de JS llama `frame.dispose()`, así que procesar
    async y cachear el resultado más tarde leería memoria ya liberada.
  - `usePoseLandmarks.ts` procesa **1 de cada 3 frames** (`PROCESS_EVERY_N_FRAMES`) — la cámara
    sigue fluida a su FPS normal, pero ML Kit (bloqueante) no se llama en cada uno.
- **3D: `three@0.180.0` (fijado, NO `latest`) + `@react-three/fiber@9.7.0` + `expo-gl`.** Sin
  `expo-three` (no hace falta — `@react-three/fiber` trae sus propios polyfills de
  `FileLoader`/`TextureLoader` en su propio entry point `"react-native"` de su `package.json`) y
  sin ningún paquete `@react-three/native` (no existe en npm). `three@latest` (0.186) tiene el
  build CJS roto/deprecado para Hermes — ver troubleshooting abajo.

### Troubleshooting real (2026-09-22): construir el Vestidor 3D real (cámara + IA de pose + 2D/3D)

Sesión larga, con el usuario probando en un teléfono físico (TECNO_LJ6, MediaTek gama
media/baja) después de cada cambio. Los hallazgos que valen la pena no perder:

1. **`GLTFLoader` no arranca en React Native**: `Cannot read property 'match' of undefined`
   dentro del constructor. **Causa real**: RN expone un `navigator` global
   (`{product: 'ReactNative'}`) pero sin `userAgent` — `GLTFLoader` asume que es un string y le
   llama `.match()` sin chequear (asume un entorno de navegador). **Fix**: parchar
   `navigator.userAgent = 'ReactNative'` con `Object.defineProperty` antes de instanciar el
   loader (ver el bloque al principio de `GarmentModel.tsx`).
2. **"Multiple instances of Three.js being imported"**: `@react-three/fiber` importa `three` vía
   `require()` (CJS), pero `GLTFLoader.js` lo importa vía `import` (ESM) — el `package.json` de
   `three` mapea cada condición a un ARCHIVO FÍSICO DISTINTO (`build/three.cjs` vs
   `build/three.module.js`), y Metro no las deduplica: quedan dos copias de la librería con
   clases distintas, así que un parche de prototipo hecho sobre una nunca lo ve la otra. **Fix**:
   en `metro.config.js`, un `resolver.resolveRequest` custom que fuerza CUALQUIER
   `import`/`require` de `'three'` a resolver siempre al mismo archivo (`build/three.cjs`).
3. **`three@latest` (0.186) tiene el build CJS roto**: `three.cjs` moderno es solo
   `process.emitWarning(...)` (API de Node, no existe en Hermes) seguido de
   `module.exports = require('./three.module.js')` (un archivo ESM, no `require`-able). **Fix**:
   fijar `three@0.180.0` + `@types/three@0.180.0` exactos.
4. **`ReferenceError: Property 'ProgressEvent' doesn't exist`** al hacer `GLTFLoader().load(uri)`:
   el `FileLoader` interno de GLTFLoader usa APIs de navegador (`fetch`/`ProgressEvent`) que no
   existen en RN. **Fix**: no usar `.load()` — leer el archivo a mano con
   `expo-file-system/legacy` (`readAsStringAsync(uri, {encoding: Base64})`, ojo: en SDK 57 esta
   función se movió al subpath `/legacy`, el import normal ya no la expone) y pasarle los bytes
   crudos a `GLTFLoader().parse(arrayBuffer, '', onLoad, onError)`, que no depende de ningún
   `FileLoader`.
5. **Metro no trata `.glb` como asset binario por defecto** (`Unable to resolve module`, incluso
   con ruta relativa correcta): agregar `'glb', 'gltf', 'bin'` a
   `config.resolver.assetExts` en `metro.config.js`. **Trampa real**: editar
   `metro.config.js` mientras Metro ya está corriendo **no aplica el cambio** — hay que matarlo
   del todo (no alcanza con Fast Refresh) y relanzarlo, a veces incluso borrando
   `/tmp/metro-cache` a mano si el error persiste con un `-c` normal.
6. **Posición vertical del modelo sistemáticamente mal** (muy arriba, tapando la cara): la
   primera versión anclaba "dónde están los hombros" con una fracción fija adivinada del alto
   total del modelo. Buscar automáticamente "la sección más ancha" de la mitad superior
   **empeoró las cosas** — ese algoritmo agarraba el busto o la cintura (casi siempre más anchos
   que los hombros en cualquier prenda con forma de cuerpo), y como todo lo que queda por
   encima del punto ancla (hombros reales incluidos) termina flotando por encima del punto
   detectado, el resultado se veía peor cuanto "más inteligente" era la búsqueda. **Fix real**:
   medir el ancho a una **altura fija** cerca del borde de arriba (`SHOULDER_FRACTION_FROM_TOP =
   0.08` en `GarmentModel.tsx`) — un solo número, fácil de recalibrar a ojo si se usa otro `.glb`.
7. **El giro (roll) sale prácticamente al revés (~175°) con la cámara trasera, pero bien con la
   frontal**: ML Kit siempre da los landmarks en coordenadas CRUDAS del sensor (sin espejar) — de
   frente a la cámara, el hombro derecho anatómico SIEMPRE tiene menor x cruda, sea cámara
   frontal o trasera. Con la frontal se espeja `x` (`1 - x`) para que la posición se vea en
   espejo — eso invierte el orden izquierda/derecha en pantalla, y por eso hacía falta un `-180°`
   extra para que "nivelado" diera ~0°. Con la trasera (sin espejar), el orden crudo YA es el
   normal de una foto sin espejo, así que aplicar ese mismo `-180°` (como pasaba antes de este
   fix) deja el vestido casi al revés incluso con los hombros nivelados. **Fix**: el `-180°` es
   condicional a `mirrored` (`- (mirrored ? Math.PI : 0)`), no fijo — confirmado con logs reales
   en ambas cámaras contra el mismo maniquí de referencia.
8. **El giro lateral (yaw, "verse de perfil" al girar el torso) se sentía como "2 fotos que se
   alternan", no un giro proporcional real**: la primera versión usaba la profundidad `z` que da
   ML Kit igual que se usa `x` para un `atan2`, asumiendo que estaba en la misma escala relativa
   — en la práctica esa `z` resultó tener una escala mucho más grande e impredecible, saturando
   el `atan2` en ±90° con cualquier ruido. **Fix real**: la magnitud del yaw sale de algo
   geométrico y estable — el ANCHO de hombros se acorta al girar el torso (escorzo), pero el
   ALTO hombro-cadera casi no cambia (es un giro sobre el eje vertical) — la razón ancho/alto cae
   de forma suave y predecible con el ángulo real de giro. Se sigue usando el SIGNO de `z` nomás
   (mucho más confiable que su magnitud) para saber hacia qué lado se giró. La calibración de
   "cuál es la razón ancho/alto de frente" es adaptativa (el máximo visto hasta ahora, con
   decadencia lenta) porque no se conoce de antemano la proporción real de cada persona.
9. **El giro seguía "saltando" de rato en rato incluso después del fix anterior**: dos causas
   reales encontradas con logs en vivo, ambas arregladas con memoria entre cuadros en vez de
   solo amortiguar:
   - Las caderas entran y salen de la detección seguido (brazos extendidos, encuadre cerrado) —
     cada vez que desaparecían, el yaw reseteaba de golpe al giro base en vez de mantenerse.
     Fix: si las caderas no son usables, se reusa el último yaw geométrico válido
     (`lastRawYaw`), no se fuerza a 0.
   - ML Kit confunde por un instante cuál hombro es cuál (izquierda/derecha), lo que invierte el
     signo de la resta en el cálculo de roll y manda el ángulo ~180° al otro extremo de golpe.
     Un tilt real de una persona nunca cambia tan rápido entre dos cuadros — un salto de más de
     100° entre cuadros consecutivos se trata como ruido y se ignora (no se arrastra el
     suavizado hacia él).
10. **`java.lang.Error: Camera is disabled, probably due to a device policy!`**: error recurrente
    de VisionCamera, no fatal — pasa cuando la sesión de cámara se reinicia (pantalla
    bloqueada/app en segundo plano mientras la cámara está activa, o el toggle de privacidad de
    "acceso a la cámara" que traen los accesos rápidos de Android). La app se recupera sola; no
    bloquea nada, solo ensucia el log.
11. **Se probó y se descartó un "balanceo de tela" falso (no física real)** — desplazar vértices
    de la falda con una onda seno/coseno según qué tan lejos están de los hombros. Se encontró y
    corrigió un bug real en el camino (comparar la Y LOCAL de cada vértice contra alturas en
    espacio MUNDO da cualquier cosa si la malla tiene su propia transformación — típico en
    exports de Sketchfab), pero el efecto corregido seguía siendo casi imperceptible y **se
    revirtió a pedido del usuario** ("quita todo lo q hiciste para las fisicas nomas"). Si se
    retoma en el futuro: la implementación correcta (factor por vértice precalculado en espacio
    mundo, `Float32Array` reusado sin asignar memoria por cuadro) puede recuperarse del historial
    de git; el problema pendiente sería más bien de amplitud/tuning, no de arquitectura.

### Limitaciones conocidas (no son bugs, son alcance no resuelto)

- **Captura de foto con overlay**: la foto de prueba (`captureScreen()`) nunca incluye lo que se
  dibuja encima de la cámara (ni puntos, ni prenda 2D, ni modelo 3D) — limitación real de
  Android/CameraX: el preview es una capa de video compuesta por hardware, separada del resto de
  la UI, y ninguna herramienta de captura basada en la vista puede agarrar las dos juntas en una
  sola llamada. La solución real (capturar cámara y overlay por separado y componerlos en
  código) queda pendiente, no es un ajuste rápido.
- **Giro completo de espaldas (180°)**: ML Kit está entrenado sobre todo para poses de frente —
  con la persona de espaldas a la cámara la confianza cae mucho o no detecta nada confiable. El
  yaw queda acotado a ~55° (frente a 3/4 de perfil) a propósito; extenderlo a un giro completo
  necesitaría una fuente de datos que no tenemos hoy.
- ~~**El modelo 3D es fijo, no por producto**~~ — **RESUELTO (22 sep 2026)**: el `.glb` sale del
  `modeloArUrl` del producto elegido en `GarmentSelectorBar`. `resolverFuenteModelo`
  (`lib/fuenteModelo.ts`) decide entre modelo empaquetado y URL remota, y `GarmentModel` descarga
  el remoto a la caché con `downloadAsync`, reusándolo si ya está (son archivos de varios MB).
  Cae al modelo empaquetado siempre que la URL no sirva, en vez de dejar el visor en error: lo
  más probable es un admin pegando el PNG de overlay en el campo del `.glb`, y
  `GLTFLoader.parse()` sobre un PNG lanza una excepción cruda. Los dos modelos de prueba
  (`black_dress.glb`, `waist_trainer.glb`, CC-BY-4.0 vía Sketchfab — **atribución requerida si se
  publica**) quedan como respaldo.
  - El campo se carga desde el panel admin del frontend (`producto-form-fields.tsx`), que hasta
    ahora **no tenía** entrada para `modeloArUrl` aunque el backend lo soportaba entero.
  - **Requisitos de un `.glb`, medidos sobre los que funcionan** (no los ~80k triángulos que se
    habían estimado): 20-37k triángulos, sin Draco, sin huesos ni animación, **prenda sola sin
    cabeza/maniquí/percha**, de pie, Y arriba. El límite de polígonos no es la GPU:
    `measureShoulderCrossSection` recorre CADA vértice en JS al cargar. Verificar con
    `scripts/verificar-glb.py` antes de cargar nada — **la ficha de Sketchfab no sirve**: la del
    "Black Dress" declara 165,2k triángulos y el archivo real tiene 36,7k.
  - **Flujo para agregar una prenda 3D**, una sola orden:
    ```
    node scripts/preparar-glb.mjs vestido.glb --triangulos 35000
    ```
    Decima con meshoptimizer, pasa las texturas a webp/1024 y **corre la verificación solo**.
    Si el modelo tiene cabeza, maniquí o percha **corta antes de decimar**, porque decimarlo no
    lo arregla. También corta si la entrada ya viene con Draco (no se puede descomprimir sin el
    decodificador). Después, subir el archivo y pegar su URL en el campo del panel admin.
  - `scripts/probar-glb-remoto.mjs` sirve el archivo por HTTP local y lo parsea con el three.js
    del proyecto, midiendo los hombros igual que `measureShoulderCrossSection` — es la prueba
    más cercana a lo que hace la app sin un teléfono. **Un modelo con texturas falla ahí con
    `self is not defined`**: es que Node no tiene decodificador de imágenes, no un problema del
    modelo; para esos usar `verificar-glb.py`, que no depende de three.
- **Paridad iOS**: no implementada (`processFrameIOS` en el módulo nativo está vacío a
  propósito) — todo este trabajo es Android-first por decisión explícita, no por omisión.

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
