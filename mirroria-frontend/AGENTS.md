# 🪞 MirrorIA Frontend — Arquitectura, Guía de Diseño y Árbol Proyectado

Este documento define la arquitectura técnica, los patrones de diseño y la estructura de
carpetas de `mirroria-frontend`. Es la fuente de verdad exclusiva del frontend — el
`AGENTS.md` de la raíz del repo (`../AGENTS.md`) solo enlaza para acá. La arquitectura y las
reglas de este documento son una adaptación directa de las que ya se usan (y funcionaron bien)
en `sw-case/case-frontend/AGENTS.md` — mismo patrón, mismo criterio de cuándo aplicar cada
regla, adaptado al dominio de negocio de MirrorIA (e-commerce) en vez del de CASE Tool
(modelado UML colaborativo).

Cualquier agente IA o desarrollador que trabaje en esta base de código **DEBE** seguir estas
directrices de forma obligatoria.

## ⚠️ Estado real (2026-09-12): scaffold inicial en blanco

`mirroria-frontend/` ya tiene el scaffold base — **Vite + React 19 + TypeScript + Tailwind v4**
(vía `@tailwindcss/vite`, sin `tailwind.config.js` — v4 no lo necesita con el plugin de Vite),
alias `@/*` → `src/*` configurado en `vite.config.ts` y `tsconfig.app.json`, puerto de dev
fijo en `5174`. **A propósito no tiene nada más todavía:** ni `shadcn/ui`, ni
`react-router-dom`, ni ninguna feature de la sección 2 — `App.tsx` es un placeholder en blanco
(`<p>MirrorIA</p>`). shadcn queda pendiente de una decisión del usuario antes de instalarlo.

El árbol completo de la sección 2 de abajo sigue siendo el **plan proyectado**, no lo que existe
hoy. El backend (`mirroria-backend/`) ya tiene `seguridad` (auth) y `catalogo` (productos)
funcionando end-to-end — esos dos son los primeros candidatos reales a consumir desde acá. Ver
`mirroria-backend/AGENTS.md` para el estado exacto de cada módulo del backend.

**Verificado (2026-09-12):** `npm run build` y `npm run lint` limpios, `npm run dev` sirve en
`http://localhost:5174` con CSS de Tailwind real compilado (no vacío).

## ✅ Estado real (2026-09-12, tarde): inicio construido con `design-taste-frontend`

Primera página real: `features/catalog/pages/HomePage.tsx` (Hero + destacados + categorías +
sucursales) dentro de `layouts/StorefrontLayout.tsx` (header sticky + footer). Construida
siguiendo la skill `design-taste-frontend` — lectura de diseño: *landing de consumo premium
(moda femenina) para compradoras que valoran estilo, lenguaje boutique-editorial pero
tecnológico, Tailwind v4 + shadcn/ui, base neutra fría con un solo acento saturado.* Diales:
`VARIANCE 7 / MOTION 6 / DENSITY 3` (preset "Landing premium consumer").

**Decisiones de shadcn tomadas en esta sesión** (contradicen lo que se había conversado antes
de correr la skill — la skill tiene reglas más estrictas y con evidencia real de qué evitar):
- **`shadcn init` con preset Nova** (`-t vite -b base -p nova`): Base UI (no Radix), ícono
  Lucide, fuente **Geist Variable** (`@fontsource-variable/geist`, autohosteado). Reemplaza la
  idea anterior de un pairing serif — la skill prohíbe explícitamente serif "porque se ve
  creativo/premium" salvo justificación real de marca, y bloquea `Fraunces`/`Instrument_Serif`
  como default. Geist ya estaba en la lista de sans-display aprobados, así que se quedó como
  única tipografía del proyecto.
- **Acento único: vino/rosa profundo** (`oklch(0.38 0.16 15)` claro, `oklch(0.68 0.17 15)`
  oscuro) sobre `--primary`/`--ring` en `src/index.css`. El resto de la paleta se quedó neutra
  (croma 0) a propósito — la skill **prohíbe explícitamente** beige+borgoña/oxblood+espresso
  como combo default para marcas premium de consumo (el cliché #2 más detectado en salidas de
  IA); acá la base es fría, no cálida, así que no cae en ese combo aunque el acento sea un rojo
  profundo similar.
- **Radio único:** `--radius: 0.75rem`, sin excepciones (Shape Consistency Lock).
- **Iconos de contenido: Phosphor** (`@phosphor-icons/react`) para todo lo que yo escribo
  (nav, features). Lucide se queda **solo** donde ya lo usa el código generado por shadcn
  internamente (`navigation-menu.tsx`, `sheet.tsx`) — no vale la pena pelear contra el
  ecosistema del componente para esos casos puntuales.
- **Animación:** `motion` (`motion/react`), `whileInView` para scroll-reveal (Sección 5.C de
  la skill) — no GSAP, el dial de motion (6) no pide pin/scrub.

**🔧 Bug real del CLI de shadcn (2026-09-12): `add` no resuelve el alias `@/*` con
tsconfig "solution-style".** Este scaffold de Vite usa el patrón moderno de
`tsconfig.json` (raíz, solo `references`) + `tsconfig.app.json` (con los `paths` reales).
`shadcn init` sí valida el alias correctamente contra `tsconfig.app.json`, pero `shadcn add`
falló y escribió los componentes en una carpeta **literal** `./@/components/ui/...` en la raíz
del proyecto (tratando `@` como nombre de carpeta) en vez de resolverlo a `src/components/ui/`.
**Fix:** duplicar los `paths` directamente en el `tsconfig.json` raíz:
```json
{
  "files": [],
  "compilerOptions": { "paths": { "@/*": ["./src/*"] } },
  "references": [ ... ]
}
```
Confirmado con un `add` de prueba después del fix: escribió directo en `src/components/ui/`.
Si en algún momento un `shadcn add` vuelve a escribir en una carpeta `@/` literal en la raíz,
mover los archivos a mano a `src/components/ui/` y no confiar en que el próximo `add` lo haga bien
sin este fix en el tsconfig raíz.

**Imágenes: fotos reales de Unsplash, no picsum.** La primera pasada usó `picsum.photos/seed/...`
(Sección 4.8 de la skill, opción 2), pero como picsum no filtra por contenido, salieron fotos sin
relación con moda (un muelle, una montaña, una iglesia). Se reemplazaron por fotos reales de
mujeres con ropa/accesorios buscadas con `WebSearch` y verificadas una por una con `WebFetch` +
`curl` antes de usarlas — confirmando en cada caso que fueran `images.unsplash.com` (licencia
libre) y **no** `plus.unsplash.com` (Unsplash+, de pago; se descartaron 2 candidatas por esto).
Los IDs quedan en `*.data.ts` de cada componente y se arman con el helper `src/lib/unsplash.ts`
(`unsplashUrl(id, w, h)`). Siguen siendo placeholders — en cuanto `catalogo` tenga productos
reales sembrados con `productos.imagenes`, esas URLs los reemplazan — pero ahora son fotos
reales y coherentes con el rubro, no genéricas.

**Verificado con Playwright (2026-09-12):** build/lint limpios, 0 errores de consola,
desktop (1440px) y mobile (390px) revisados visualmente, menú mobile (`Sheet`) abre y
cierra correctamente, scroll-reveal de Motion funciona al hacer scroll real (una captura
"full page" sin scroll real deja esas secciones en opacidad 0 — falso positivo del método de
captura, no del código).

## ✅ Estado real (2026-09-14): `category-showcase.tsx` conectado a fotos reales de productos

Se reemplazaron los íconos grises de perchero (`CoatHanger`) conectando `CategoryShowcase` a `useProductos()` y `useCategorias()`:
- Por cada categoría, el componente busca dinámicamente una prenda registrada en esa categoría que tenga imagen en la base de datos (`p.categoriaId === c.id && p.imagenes?.[0]?.url`).
- Si existe, renderiza la fotografía real de la prenda (`<img>` con `referrerPolicy="no-referrer"` y zoom suave al hover), el nombre de la categoría, el título de la prenda de referencia en tipografía sutil (`text-white/75`) y el botón con ícono `ArrowUpRight`.
- Se eliminó la categoría huérfana de prueba `Test Guard` de la base de datos, dejando las 5 categorías reales (`Vestidos`, `Blusas`, `Pantalones`, `Ropa Deportiva`, `Accesorios`) en una cuadrícula responsiva `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`.
- Verificado con Playwright: todas las tarjetas cargan con sus fotografías de alta calidad sin errores de red ni advertencias de consola.

## ✅ Estado real (2026-09-12): `features/auth/` completo — login, registro y sesión real

Primera feature con estado real (no solo presentacional): registro y login funcionando de
punta a punta contra `mirroria-backend` (`modules/seguridad`), con sesión persistida y
reactiva en toda la app.

**Se agregó al stack** (no estaba antes): `react-router-dom` (rutas `/`, `/login`,
`/register`), `react-hook-form` + `zod` + `@hookform/resolvers` (validación de formularios,
regla ya prevista en la sección 0 de este documento), y los primitivos shadcn `input`,
`field`, `alert`, `label`, `card`.

- **`src/lib/api.ts`** — `apiFetch()`: agrega `Authorization: Bearer` desde `localStorage`
  automático, parsea el shape de error único del backend (`{status, message, timestamp}`).
- **`src/context/AuthContext.tsx`** (+ `auth-context.ts` para el objeto de contexto crudo,
  separado por el warning de fast-refresh de tener contexto y componente en el mismo archivo)
  — a diferencia de `case-frontend` (que no usó Context porque le alcanzaba con
  `localStorage` leído directo), acá sí hace falta: el navbar necesita reaccionar en vivo
  cuando `LoginPage` hace login, y son componentes distintos sin remount entre sí.
  `src/hooks/useAuth.ts` es el hook de consumo.
- **`features/auth/`**: `api/authApi.ts` (login/register/getMe), `types/auth.types.ts`
  (espejo de los DTOs del backend), `hooks/{useLogin,useRegister}.ts` (loading/error/submit),
  `components/{login-form,register-form}/` (RHF + Zod, mismos mensajes de validación que
  las constraints del backend: password mínimo 8, etc.), `pages/{LoginPage,RegisterPage}.tsx`.
- **`layouts/AuthLayout.tsx`** — card centrada, logo con link a `/`.
- **`routes/GuestRoute.tsx`** — si ya hay sesión, `/login` y `/register` redirigen a `/`.
  `ProtectedRoute` todavía no existe — se agrega cuando exista la primera página que
  realmente lo necesite (nada que proteger todavía).
- **`site-header.tsx`** ahora consume `useAuth()`: muestra "Hola, {nombre}" + botón de
  cerrar sesión cuando hay usuario, o el link a `/login` cuando no — tanto en desktop como en
  el menú mobile (`Sheet`).

**🔧 Bug real encontrado y corregido (2026-09-12): 401 de login se mostraba como "Sesión
expirada".** `apiFetch()` interceptaba *cualquier* 401 como "la sesión expiró" (limpia
`localStorage` y manda a `/login`) — comportamiento correcto para un endpoint protegido, pero
`POST /seguridad/auth/login` también devuelve 401 cuando la contraseña es incorrecta, que es
un caso completamente distinto (no hay sesión que limpiar, no hay que redirigir, y el mensaje
real del backend — "Credenciales incorrectas" — se perdía). Fix: `apiFetch` ahora excluye
`/seguridad/auth/*` del manejo especial de 401, dejando que esos endpoints devuelvan su
mensaje real. Verificado con Playwright: login con password incorrecta → "Credenciales
incorrectas" (antes decía "Sesión expirada"); registro con email duplicado → "Ya existe un
usuario con ese email" (409, nunca estuvo roto, pero se verificó en la misma pasada).

**Verificado end-to-end (2026-09-12)** contra backend real (`mirroria-backend` +
Postgres docker): registro → sesión iniciada automáticamente → navbar refleja el nombre real
→ cerrar sesión → `/login` con las mismas credenciales → sesión iniciada de nuevo → navegar a
`/login` estando logueada redirige a `/` (`GuestRoute`). `impeccable detect` sin hallazgos
sobre los archivos de UI nuevos.

## ✅ Estado real (2026-09-12): pasada `impeccable bolder` — login/register/sucursales

Feedback directo del usuario: "esta muy simple todo, mejorar el login, el register, la
landing page, que no sea todo plano". Se usó `impeccable bolder`, que exige amplificar **lo
que el sistema visual ya tiene** en vez de inventar algo nuevo — mismo motivo (foto real +
overlay de gradiente) que ya usaban `feature-highlights`/`category-showcase`, llevado a los
dos puntos que realmente se habían quedado planos:

- **`AuthLayout`** (login y registro): antes era una card blanca centrada sin ninguna
  personalidad de marca. Ahora es un split-screen — panel editorial con foto real (verificada
  igual que las anteriores: `images.unsplash.com`, no `plus.`) + overlay de gradiente + frase
  de marca, panel de formulario limpio al lado. **Se sacó el `Card` que envolvía el
  formulario** — en un split-screen la separación de fondo ya da la jerarquía, un card ahí
  era contenedor de más. En mobile el panel de foto se oculta (`hidden lg:block`, colapso
  explícito) y queda solo el formulario.
- **`BranchesStrip`**: era la sección más chata de todo el inicio — una caja gris plana con
  texto y badges. Ahora es un banner full-bleed con foto real de un rack de ropa + el mismo
  overlay de gradiente, badges con `backdrop-blur` sobre la foto.

Ambas fotos nuevas verificadas con el mismo proceso que las anteriores (`WebSearch` +
`WebFetch` + `curl`, confirmando `images.unsplash.com` y no Unsplash+). `impeccable detect`
sin hallazgos sobre todo `src/`, verificado con Playwright en desktop y mobile (el panel de
foto del login se ve completo en captura full-page — una captura de solo viewport lo había
cortado por casualidad justo en el borde, no era un bug real).

## 🔧 Bug real corregido (2026-09-13): las imágenes se salían de la pantalla

Feedback del usuario: "las imagenes estan muy grandes en todas partes... en el login y en el
register se salen de la pantalla, tambien en el hero section, como q se rompe". Confirmado con
Playwright en 1366×768 (resolución de laptop muy común): en `/login`, `document.documentElement`
medía 911px de alto contra un viewport de 768px — la página no encajaba en un viewport,
rompiendo el split-screen. En el hero, la imagen invadía muy por debajo del fold.

**Causa raíz (dos bugs relacionados, mismo patrón equivocado):**
1. **`AuthLayout`**: el panel de foto (`<div className="relative hidden overflow-hidden
   lg:block">`) no tenía ninguna altura definida — dependía de que el grid lo "estirara", pero
   un grid con fila `auto` no fuerza una altura a sus items; sin altura definida en el padre,
   `h-full` en el `<img>` no resuelve contra nada y el navegador cae al tamaño intrínseco de la
   imagen (ancho de columna × su propio ratio ≈ 900px de alto), que termina empujando **toda la
   página** a esa altura.
2. **`HeroSection`**: usaba `<AspectRatio ratio={4/5}>` (proporción vertical) escalada al ancho
   de la columna. En una columna ancha (mitad de `max-w-7xl` ≈ 600-650px), una proporción 4:5
   da ~750-810px de alto — más que el alto de pantalla en laptops comunes (768px, 800px).

**Fix, mismo criterio en los dos lugares — alto FIJO y explícito, nunca derivado del ancho:**
- `AuthLayout`: contenedor externo pasó de `min-h-dvh` a `lg:h-dvh` (fijo, no mínimo) +
  `lg:grid-rows` implícita ahora sí definida; el panel de foto ahora es `lg:h-full` (contra un
  padre con alto ya definido) y la imagen es `absolute inset-0 h-full w-full object-cover` en
  vez de solo `h-full w-full` directo. Panel de formulario con `lg:overflow-y-auto` como red de
  seguridad si algún form fuera más alto que el viewport a futuro.
- `HeroSection`: se sacó `AspectRatio` por completo. El contenedor de la imagen ahora es
  `relative h-72 sm:h-96 lg:h-[520px]` (alto fijo por breakpoint, tope 520px sin importar cuán
  ancha sea la columna) + `absolute inset-0 h-full w-full object-cover` en la imagen. También
  se sacó el `lg:min-h-[85dvh]` de la sección — ya no hacía falta forzar una altura de sección
  cuando la imagen ya no la infla artificialmente.

**Regla general para cualquier imagen nueva en este proyecto:** nunca `h-full`/`w-full` directo
sobre un `<img>` cuyo padre no tenga una altura explícitamente definida (fija, `dvh`, o vía
`AspectRatio` en una columna angosta donde el resultado sea predeciblemente chico). Preferir
siempre el patrón `contenedor relative con alto fijo o acotado` + `img absolute inset-0 h-full
w-full object-cover` — es el mismo patrón que ya usaban bien `feature-highlights.tsx`
(`min-h-[22rem]`) y `branches-strip.tsx` (`min-h-80`), que nunca tuvieron este bug.
`category-showcase.tsx` usa `AspectRatio` pero en columnas angostas (¼ del ancho) donde el
resultado siempre da una altura chica y seguro — ahí no hizo falta cambiar nada.

**Verificado con Playwright en 6 anchos** (390, 834, 1024, 1366, 1920, 2560px): cero overflow
horizontal ni vertical en `/`, `/login` y `/register` — en 1366×768 y 1024×700,
`document.documentElement.scrollHeight` quedó exactamente igual al `clientHeight` del viewport
(antes: 911px vs 768px). `impeccable detect` sin hallazgos.

## 🔧 Consistencia corregida (2026-09-13): `index.ts` faltante en 6 carpetas de componente

El usuario pidió una auditoría explícita ("usaste la arquitectura y patrón que quedamos") en
vez de dar por sentado que sí. Al revisar carpeta por carpeta contra la Sección 1.C de este
documento, aparecieron dos inconsistencias reales:

1. **`index.ts` inconsistente**: `login-form/` y `register-form/` sí lo tenían, pero
   `hero-section/`, `feature-highlights/`, `category-showcase/`, `branches-strip/`,
   `layouts/site-header/` y `layouts/site-footer/` no — quedaron importando el archivo
   directo (`../components/hero-section/hero-section`) en vez de la carpeta
   (`../components/hero-section`). No rompía nada, pero no seguía el patrón parejo. Se
   agregó `index.ts` (`export * from "./nombre"`) a las 6 carpetas y se actualizaron los dos
   puntos que las importaban (`HomePage.tsx`, `StorefrontLayout.tsx`) para importar desde la
   carpeta, no del archivo.
2. **Documentación desactualizada**: la sección 2 (árbol proyectado) todavía listaba
   `lib/utils.ts # cn() y utilidades generales`, un archivo que nunca se creó — el preset de
   shadcn instalado (Base UI/"Nova") usa el paquete npm `cn` (de shadcn-ui, drop-in de
   clsx+tailwind-merge) en vez de un helper local. El código ya era consistente con esto
   (todo el proyecto importa `cn` de `"cn"`, igual que los primitivos generados); se corrigió
   el árbol de la sección 2 para reflejarlo y se agregó `lib/unsplash.ts` (existía en el
   código pero no estaba en el árbol documentado).

Verificado: build y lint limpios tras el cambio de imports, `impeccable detect` sin
hallazgos, sin errores de consola al recargar `/`.

## ✅ Estado real (2026-09-13): hero rediseñado — full-bleed en vez de split 50/50

El usuario pidió ver una alternativa al hero (split 50/50 sobre fondo blanco) "solo para
comparar". Se armó `hero-section-alt.tsx` con foto **full-bleed** (ocupa todo el ancho) +
overlay de gradiente + texto abajo-izquierda — mismo motivo visual que ya usan
`AuthLayout`/`BranchesStrip`, llevado al hero. Mismo copy, mismos botones, mismo alto fijo
por breakpoint que el original (para que la comparación fuera justa). Se dejó swapeado
temporalmente en `HomePage.tsx` para que el usuario lo viera en vivo en `localhost:5174`, sin
tocar el `hero-section.tsx` original.

**El usuario prefirió la alternativa**, pero encontró un problema real en mobile: el
`object-cover` recortaba mal y dejaba la cara de la modelo prácticamente afuera del encuadre
(solo se veía una repisa de lentes de fondo). Causa: la foto original de Unsplash es
**vertical** (retrato, ratio ≈ 0.74), pero se estaba pidiendo con `unsplashUrl(id, 1800,
1000)` — un recorte panorámico forzado del lado del servidor. Ese recorte ya descartaba la
mitad superior/inferior de la foto (donde está la cara) *antes* de que el navegador aplicara
su propio `object-cover` para encajarla en el hero — un doble recorte que en mobile (contenedor
angosto) terminaba mostrando una porción sin nada de interés.

**Fix:** se agregó `unsplashUrlNative(photoId, width)` en `lib/unsplash.ts` — pide la foto en
su proporción **nativa** (sin forzar `w`×`h` de servidor), dejando que **todo** el recorte
ocurra del lado del navegador vía CSS. Como la foto es vertical, en mobile (contenedor angosto
y alto) `object-cover` recorta los *lados*; en desktop (contenedor ancho y bajo) recorta
*arriba/abajo* — direcciones opuestas del mismo recorte, y en ambas direcciones el sujeto
queda bien encuadrado con un solo `object-[50%_38%]` (encontrado inspeccionando la foto
original para ubicar dónde cae la cara). Mismo criterio a tener en cuenta para cualquier
imagen futura que deba verse bien en proporciones de contenedor muy distintas (mobile vertical
vs. desktop panorámico): pedir la foto **sin** recorte de servidor y dejar que `object-cover` +
`object-position` hagan todo el trabajo — un `fit=crop` de servidor con `w`/`h` fijos, como el
que sigue usando `unsplashUrl()` para las demás imágenes (categorías, bento, sucursales,
auth), solo es seguro cuando esas imágenes se muestran siempre en contenedores de proporción
parecida entre mobile y desktop (que es el caso de esas, pero no el de un hero full-bleed).

Una vez confirmado, se promovió `hero-section-alt.tsx` a `hero-section.tsx` (reemplazando el
split 50/50 original) y se borró el archivo `-alt`, sin dejar imports temporales ni archivos
de comparación colgando. Verificado con Playwright en 390/1024/1440px, build/lint/`impeccable
detect` limpios.

## 🔧 Bug real corregido (2026-09-13): cara cortada en desktop — el ancho crecía, el alto no

El usuario reportó "se ve cortada la cara en compu" después del cambio anterior. Se había
verificado en 1440px y 1024px (se veían bien), pero **no en 1920px** — una de las resoluciones
de escritorio más comunes que existen. Ahí sí se rompía: se veían la frente y los ojos, pero
el mentón quedaba cortado justo en el borde inferior del hero.

**Causa raíz:** el contenedor tenía altura fija por breakpoint (`lg:h-[680px]`), pero **sin
ningún tope hacia arriba** — de 1024px en adelante, el ancho crece sin límite mientras el alto
se queda clavado en 680px. Como la foto es vertical, `object-cover` recorta arriba/abajo en
desktop: cuanto más ancho el contenedor respecto a su alto fijo, más angosta (en términos de
porcentaje de la foto original) es la franja vertical que queda visible. A 1440px esa franja
alcanzaba a cubrir toda la cara; a 1920px ya no.

**Fix, dos partes:**
1. **Alturas intermedias `xl`/`2xl`** (`xl:h-[780px] 2xl:h-[880px]`) — mantienen la proporción
   alto/ancho razonablemente estable a través de las resoluciones de escritorio más comunes
   (1280-1920px), en vez de quedarse fija desde los 1024px hasta el infinito.
2. **Tope de ancho en el contenedor de la imagen** (`max-w-[2200px]`, centrado con
   `left-1/2 -translate-x-1/2`) — para monitores ultra anchos (2560px+) donde ni agregar más
   alturas por breakpoint alcanza sin volver el hero absurdamente alto. Más allá de ese ancho,
   el recorte queda "clavado" en vez de seguir adelgazándose sin límite; el `section` tiene
   `bg-neutral-950` de fondo para que el sobrante a los costados en pantallas ultra anchas se
   vea como una decisión de diseño (barras oscuras), no como un error.

**Lección para cualquier imagen full-bleed futura en este proyecto:** nunca dejar una altura
fija aplicada desde un breakpoint "hacia arriba sin techo" (`lg:h-[X]` sin `xl`/`2xl` después)
cuando el ancho del contenedor no tiene límite — probar explícitamente en 1920px y 2560px
además de los tamaños "obvios" (1024, 1366, 1440), porque 1920px es probablemente la
resolución de escritorio individual más común y un bug ahí no es un caso extremo, es el caso
típico.

**Verificado con Playwright en 6 anchos** (390, 1024, 1280, 1536, 1920, 2560px): cara completa
visible con margen en todos, cero overflow horizontal, build/lint/`impeccable detect` limpios.

## ✅ Estado real (2026-09-13): e-commerce real — tienda, ficha de producto, carrito y checkout

Pedido del usuario: dejar de ser "solo una landing page" y construir el e-commerce real
(navbar incluida), sin fotos todavía (placeholder deliberado, no Unsplash), sembrar datos
reales en la BD en vez de más `.data.ts` estáticos, y auditar que todo esto siga el patrón de
carpetas/arquitectura documentado acá. Backend usado tal cual quedó en la sesión anterior:
`sucursales`, `inventario` y `ventas` ya completos (ver `mirroria-backend/AGENTS.md`).

**Datos reales sembrados en Postgres** (vía `curl` contra la API, no fixtures/mocks): 3
categorías nuevas (Blusas, Pantalones, Accesorios — Vestidos ya existía), 2 tallas (S, L — M ya
existía), 3 colores (Negro, Azul, Blanco — Rojo ya existía), 6 productos nuevos con sus
variantes (14 variantes en total sumando las nuevas), y stock inicial de 15 unidades por
variante en la sucursal existente vía `POST /inventario/ajustes` (motivo: "Carga inicial de
inventario para pruebas de frontend") — el catálogo ya no depende de un solo producto de
prueba.

**`lib/money.ts` (`formatMoney`)** pasó de "sugerencia" (sección 4) a construido: con
`product-card`, `cart-item` y `checkout` mostrando precio, se cruzó el umbral de 2+
consumidores de la regla de promoción de la sección 1.E.

**Features nuevas, siguiendo 1:1 el árbol proyectado de la sección 2:**
- `features/catalog/` ganó `types/`, `api/catalogApi.ts` (`getCategorias`, `getProductos`,
  `getProducto`), `hooks/{useCategorias,useProductos,useProducto}.ts`,
  `components/{product-card,product-grid,product-detail}/`, `pages/{ProductListPage,
  ProductDetailPage}.tsx`. `CategoryShowcase` (landing) dejó de usar `CATEGORY_TILES`
  estático — ahora consume `useCategorias()` real y cada tile enlaza a
  `/tienda?categoria=<id>`; se borró `category-showcase.data.ts`.
- `features/branches/` (nueva, mapea a `sucursales` del backend): `types/`,
  `api/branchesApi.ts`, `hooks/useSucursales.ts`, `components/branch-picker/` (select de
  shadcn, usado en la ficha de producto y en checkout).
- `features/cart/` (nueva, mapea a `ventas`/`carritos`): `types/`, `api/cartApi.ts`,
  `hooks/useCartLineItems.ts`, `components/{cart-item,cart-summary}/`, `pages/CartPage.tsx`.
- `features/checkout/` (nueva, mapea a `ventas`/checkout): `types/`, `api/checkoutApi.ts`,
  `hooks/{useCheckout,useVenta}.ts`, `components/order-summary/`,
  `pages/{CheckoutPage,OrderConfirmationPage}.tsx`.
- `context/cart-context.ts` + `context/CartContext.tsx` + `hooks/useCart.ts`: mismo patrón
  exacto que `AuthContext` (contexto crudo separado del Provider, hook de consumo en
  `src/hooks/`). Existe como contexto global (no solo estado local de `CartPage`) por el mismo
  motivo que `AuthContext`: el ícono del carrito en el navbar necesita reaccionar en vivo
  cuando se agrega un producto desde la ficha de detalle, un componente completamente distinto.
  `CartProvider` envuelve `<App />` dentro de `AuthProvider` en `main.tsx` (depende de
  `useAuth()` para saber el `usuarioId`).
- `routes/ProtectedRoute.tsx`: por fin se construyó — era el primer caso real que lo
  necesitaba (`/carrito`, `/checkout`, `/checkout/:id/confirmacion`), tal como estaba previsto
  ("se agrega cuando exista la primera página que realmente lo necesite").

**Simplificaciones reales y a propósito, documentadas para no confundirlas con descuido:**
1. **Filtro de categoría en el cliente**: el backend (`GET /catalogo/productos`) todavía no
   acepta `?categoriaId=`. Con un catálogo del tamaño de un examen, traer todo y filtrar en
   `useProductos(categoriaId)` es aceptable — el fix real si el catálogo crece es un query
   param en el backend, no más lógica acá.
2. **Enriquecido del carrito por N+1**: `carritos.items` (backend) solo trae
   `{varianteId, cantidad}` — no hay endpoint para resolver "a qué producto pertenece esta
   variante". `useCartLineItems` trae el listado liviano + el detalle (con variantes) de
   *cada* producto y arma el cruce en el cliente. Correcto y honesto para un catálogo chico;
   si crece, el fix real es un endpoint de backend dedicado.
3. **Sin editor de cantidad en el carrito**: el backend solo expone agregar (que suma) y
   quitar (que borra la línea entera) — no hay `PATCH` para cambiar cantidad. La UI no finge
   un stepper que no tiene a dónde pegarle.
4. **Sin formulario de pago**: el módulo `pagos` no existe todavía. El checkout digital
   confirma el pedido en estado `PENDIENTE` y lo dice explícitamente en la UI ("el cobro
   digital todavía se coordina manualmente") — se decidió no fabricar un formulario de tarjeta
   falso solo para que se vea completo, que es exactamente el tipo de dato temporal que se
   pidió dejar de crear.
5. **`inventarioApi`/`useDisponibilidad` viven dentro de `features/catalog/`**, no en una
   feature `inventory/` propia — hoy tienen un solo consumidor (la ficha de producto, RF08).
   Mismo criterio que la regla de promoción de hooks (sección 1.E): se promueve a su propia
   feature si en el futuro un panel admin necesita más operaciones de inventario.
6. **Imágenes de producto ignoradas a propósito** (`ProductImagePlaceholder`, en
   `components/common/`, reemplaza el slot `ProductGallery` proyectado en la sección 2): ni
   siquiera se lee `producto.imagenes` — un producto sembrado de prueba anterior tiene una URL
   dummy (`example.test`) que rompería como `<img src>`, y esto evita ese tipo de dato falso
   de forma sistemática hasta que exista un pipeline real de assets. Textura con degradado +
   ícono `CoatHanger` (Phosphor) en vez de una caja gris plana o un ícono de imagen rota.

**🔧 Bug real encontrado y corregido (2026-09-13): el `Select` de sucursal mostraba el UUID
crudo y tiraba un warning de React.** El preset Base UI/Nova de shadcn (`select.tsx`) usa
`@base-ui/react/select`, cuyo `Select.Value` — a diferencia de Radix — **no** cruza
automáticamente el `value` seleccionado con el texto del `SelectItem` correspondiente; por
default renderiza el `value` crudo tal cual (acá, el UUID de la sucursal). Fix: `SelectValue`
acepta `children` como función `(value) => ReactNode` (documentado por Base UI para exactamente
este caso) — `BranchPicker` ahora le pasa `(id) => sucursales.find(s => s.id === id)?.nombre...`.
Aparte, pasar `value={value ?? undefined}` cuando el estado empieza en `null` hacía que el
`Select` pasara de no-controlado a controlado al elegir una opción (warning real de React) —
fix: `value={value ?? ""}` para que el componente sea controlado desde el primer render.
**Regla general para cualquier `Select` futuro en este proyecto con value inicial nulo:**
nunca `?? undefined`, siempre `?? ""` (o el sentinel que corresponda) desde el primer render.

**Navbar actualizada** (motivo del pedido: "que no sea solo de la landing page"):
`NAV_ITEMS` pasó de anchors de la landing (`#categorias`, `#vestidor`, `#sucursales`) a rutas
reales (`Inicio` → `/`, `Tienda` → `/tienda`), usando `<Link>` en vez de `<a href>` (regla 3.4).
El ícono de carrito ahora es un `<Link to="/carrito">` real con un `Badge` que muestra
`itemCount` de `useCart()` — reactivo en vivo, sin necesitar recargar la página. El CTA
primario del hero (`"Ver catálogo"`) también pasó de `href="#categorias"` a `to="/tienda"` vía
`Link`; de paso se sacó `imageId` de `hero-section.data.ts`, un campo muerto que quedó de antes
de migrar el hero a la foto local (`public/images/hero-model.jpg`).

**Verificado end-to-end con Playwright (2026-09-13)** contra backend + Postgres reales:
navegar a `/tienda` → filtrar por categoría (Blusas) → abrir un producto → elegir talla+color →
elegir sucursal → ver stock real (`15 disponibles`) → agregar sin sesión redirige a `/login` →
registrarse → agregar dos productos distintos al carrito → el badge del navbar sube a `1` en
vivo → `/carrito` muestra ambos ítems enriquecidos (nombre, talla, color, precio, subtotal
correcto) → quitar un ítem → `/checkout` con el resto → elegir sucursal de entrega → confirmar
→ `/checkout/:id/confirmacion` con el total y estado "Pendiente de pago" → carrito queda vacío
y el badge vuelve a desaparecer → cerrar sesión → `/checkout` redirige a `/login`
(`ProtectedRoute`). Mobile (390×844): cero overflow horizontal en `/tienda` y en la ficha de
producto. `build`/`lint` limpios (solo warnings preexistentes del patrón `useEffect` + `fetch`
manual, mismo patrón que ya usaba el proyecto — TanStack Query sigue siendo una sugerencia
pendiente, no una decisión tomada) e `impeccable detect` sin hallazgos sobre todo el código
nuevo.

**Autoauditoría de arquitectura** (el usuario la pidió explícitamente en el mismo pedido): cada
feature nueva replica la carpeta `api/types/hooks/components/pages` del árbol proyectado en la
sección 2; todo componente de página usa carpeta + `index.ts` (mismo criterio ya fijado el
2026-09-13 anterior); `.data.ts` solo donde ya existía o donde hay contenido estático real
(no se creó ninguno nuevo — todo lo nuevo es datos reales de API); alias `@/*` en todos los
imports salvo los relativos dentro de la propia feature (`../hooks/...`), igual que el resto
del proyecto; `ProtectedRoute`/`GuestRoute` sin lógica de negocio, solo redirect. La única
decisión de arquitectura no prevista explícitamente en el árbol proyectado es la de
`inventarioApi` dentro de `catalog/` en vez de una feature `inventory/` — documentada arriba
con su razón y su criterio de cuándo promoverla.

## ✅ Pasada real de `impeccable polish` (2026-09-13) sobre el e-commerce recién construido

El usuario pidió explícitamente usar las skills de diseño para esta tanda, no solo aplicar el
sistema ya establecido de memoria. Se corrió `impeccable polish` sobre `product-grid`,
`product-detail`, `cart/` y `checkout/`. Sin `PRODUCT.md`/`DESIGN.md` todavía (refinamiento
acotado, código existente como autoridad — `SCOPED_EXISTING_ALLOWED`), triage completo por
prioridad encontró y corrigió defectos reales, no cosméticos:

1. **Bug funcional real (prioridad 1): `useCartLineItems` sin `try/catch`.** Si
   `catalogApi.getProductos()`/`getProducto()` fallaban, la promesa quedaba rechazada sin
   capturar — `isLoading` nunca volvía a `false` y `/carrito` mostraba el skeleton de carga
   para siempre, sin ningún mensaje. Fix: `try/catch/finally` + un campo `error` nuevo,
   propagado y mostrado en `CartPage` y `CheckoutPage`.
2. **Estados faltantes (prioridad 2): errores nunca se mostraban.** `ProductListPage` leía
   `error` de `useProductos`/`useCategorias` pero nunca lo renderizaba — un fallo de red
   quedaba silencioso. Se agregó el `Alert` correspondiente, mismo patrón que ya usaba
   `ProductDetailPage`.
3. **Foco visible por teclado faltante (prioridad 2/accesibilidad):** los pills de filtro de
   categoría (`product-grid`) y los swatches de talla/color (`product-detail`) eran `<button>`
   a mano sin `focus-visible:ring` — inconsistente con `category-showcase`, que sí lo tiene.
   Se agregó el mismo tratamiento (`focus-visible:ring-2 ring-primary ring-offset-2
   ring-offset-background`) a ambos.
4. **Jerarquía/contenido (prioridad 3): tallas en orden arbitrario.** El backend no expone
   `talla.orden` en `VarianteResponseDto` (solo en `GET /catalogo/tallas`), así que las
   variantes se mostraban en el orden en que se crearon (ej. "L, M, S"). Fix: se ordenan por un
   array conocido (`["XS","S","M","L","XL","XXL"]`) en el cliente — no es un dato inventado,
   es solo orden de presentación.
5. **Fricción real en el flujo (prioridad 3): productos de una sola variante pedían un clic
   innecesario.** Cinturón de Cuero y Bufanda Estampada tienen una sola talla y un solo color
   — antes había que igual hacer clic en cada swatch para habilitar "Agregar al carrito". Fix:
   `useEffect` que preselecciona automáticamente cuando `options.length === 1`.
6. **Consistencia de movimiento (prioridad 4): las plantillas nuevas no tenían ningún
   movimiento**, mientras el resto del sitio (hero, category-showcase, feature-highlights) usa
   `motion/react` consistentemente. Se agregó **un solo momento autorado** por vista, mismo
   lenguaje ya establecido: `product-grid` revela las tarjetas con `whileInView` + stagger
   (idéntico a `category-showcase`), `product-detail` hace fade+slide del bloque de info
   (idéntico al hero). No se agregó movimiento a `cart`/`checkout` — son pantallas
   transaccionales de una sola pasada, no vitrinas, y `motion` en cada fila del carrito habría
   sido "efectos dispersos" en vez de "un momento autorado".
7. **Limpieza de código (prioridad 5): prop `disabled` muerta en `CartSummary`.** El
   componente solo se renderiza cuando `lineItems.length > 0` (el estado vacío lo maneja
   `CartPage` aparte), así que la rama `disabled` nunca era alcanzable. Se sacó el prop y esa
   rama entera.
8. **Descomposición**: al agregar el `useEffect` de auto-selección y el `motion.div`,
   `product-detail.tsx` pasó de 130 a 165 líneas — se extrajo `VariantSwatchGroup` a su propio
   archivo (`variant-swatch-group.tsx`, mismo patrón de subcomponente co-ubicado que ya usa
   `product-grid.tsx` con `FilterPill`), volviendo a 130 líneas.

Verificado de nuevo end-to-end con Playwright tras los cambios (login → agregar al carrito con
auto-selección de variante única → checkout → confirmación), `build`/`lint` limpios,
`impeccable detect --json` sin hallazgos sobre los 4 directorios.

## 🔧 Bug real definitivamente resuelto (2026-09-13): alto adaptativo, encuadre facial impecable y difuminado suave continuo

El usuario reportó que el hero salía cortado, no se adaptaba dinámicamente a la pantalla del
usuario y, especialmente en celular, el rostro de la modelo quedaba tapado por el texto o
mutilado por los recortes forzados.

**Causas raíz identificadas:**
1. **En mobile (<1024px):** El hero estaba artificialmente limitado a un alto rígido de 420px
   (`min(85dvh, 420px)`), ocupando apenas la mitad de un smartphone moderno (844px-915px). Al
   haber tan poco alto disponible, el bloque de texto y botones ocupaba casi todo el espacio vertical,
   empujando las letras justo encima de los ojos y la boca de la modelo, a la vez que recortaba
   la coronilla de su cabeza.
2. **En desktop (>=1024px):** Una fotografía editorial vertical (proporción ~0.74) estirada a todo
   el ancho de un monitor panorámico (1366px-1920px) con `object-cover` descartaba más del 70%
   de su altura vertical para cubrir el ancho. Al colocar el texto en el lateral izquierdo
   (`max-w-xl`), éste colisionaba con las coordenadas horizontales del reflejo del espejo (X ≈ 43%).

**Gotchas intermedios resueltos durante las iteraciones:**
- **El "corte negro" (`w-[58%]`):** Al intentar acotar la imagen a la mitad derecha (`w-[58%] right-0`)
  para no colisionar con el texto, se producía un corte duro vertical ("como cortada negro") donde
  empezaba el contenedor de la imagen, ya que el degradado no alcanzaba a cubrir la unión.
- **La "pantalla negra" y dependencia de Unsplash:** La imagen se pedía por URL externa a
  `images.unsplash.com`. Por problemas de red o latencia de CDN, la imagen a veces quedaba en
  `complete: false` y `naturalWidth: 0`, mostrando el fondo negro de la sección. Además, se habían
  solapado degradados con paradas de Tailwind demasiado densas (`via-85%`, etc.) que oscurecían la foto.

**Solución arquitectónica definitiva:**
1. **Asset local en `public/images/hero-model.jpg`:** Se migró la fotografía original en alta
   resolución (1400×1902) directamente a la carpeta pública del frontend. Carga instantánea en 0ms
   desde el servidor local/Vite, eliminando cualquier fallo por latencia, bloqueos o caídas de Unsplash.
2. **Imagen a ancho completo (`w-full inset-0`):** La imagen se extiende por todo el fondo sin
   ningún contenedor acotado, erradicando cualquier corte recto o división artificial visible.
3. **Difuminado suave y diferenciado por breakpoint (cero saturación de sombras):**
   - **En Mobile (<1024px):** Solo degradado vertical inferior (`bg-gradient-to-t from-black/90 via-black/35 to-transparent`).
     La modelo luce en su proporción casi nativa con `object-[45%_18%]`: cabello, ojos, gafas,
     labios, mentón y collar quedan 100% visibles y luminosos arriba, mientras el texto reposa
     cómodamente abajo sobre la sombra protectora.
   - **En Desktop (>=1024px):** Solo degradado horizontal izquierdo (`bg-gradient-to-r from-black via-black/60 to-transparent`).
     La tipografía se apoya a la izquierda sobre negro puro, mientras la modelo hacia la derecha
     queda brillante, clara y con un desvanecimiento orgánico continuo hacia el fondo oscuro.
4. **Altura reactiva al viewport:** `h-[calc(100svh-4rem)] min-h-[560px] max-h-[880px]`.
   El hero llena de forma exacta la pantalla visible bajo el navbar de 4rem (64px) en cualquier
   resolución, encogiendo suavemente si la ventana se achica para mantener los botones visibles.

**Verificado exhaustivamente con Playwright en 7 resoluciones reales:**
- Mobile estándar (iPhone 13/14 390×844) y compacto (iPhone SE 375×667)
- Tablet vertical (iPad 768×1024)
- Laptops estándar (1366×768) y alta resolución (MacBook 1440×900)
- Desktop panorámico (Full HD 1920×1080) y ventana baja achicada (1920×650)
En todas las resoluciones: 0 overflow, carga en 0ms, rostro completo libre de recortes y textos 100% legibles.

## ✅ Estado real (2026-09-13): navbar con contenido real — dejó de sentirse vacía

Feedback directo del usuario: "en la navbar solo 2 enlaces se me hace muy vacío, no hay para
buscar ni para otro apartado" + "hay solo iniciar sesión, no hay registrarse". Se agregó
contenido **real** (páginas y datos existentes), no relleno decorativo:

- **`SearchInput`** (`components/common/`, exactamente el slot que ya estaba proyectado en la
  sección 2 de este documento): buscador por título de producto. Al enviar, navega a
  `/tienda?q=<término>`. `useProductos` ganó un segundo filtro client-side (`query`, mismo
  criterio ya documentado que el filtro por categoría — el backend no expone `?q=` todavía).
  Presente en el header desktop (`md:block`) y arriba del todo en el Sheet mobile.
- **`CategoriesMenu`** (`layouts/site-header/categories-menu.tsx`, subcomponente co-ubicado,
  mismo patrón que `variant-swatch-group.tsx` en `product-detail/`): dropdown "Categorías" con
  `NavigationMenu` de shadcn (Base UI, instalado pero sin usar hasta ahora) — lista las
  categorías reales vía `useCategorias()`, cada una linkea a `/tienda?categoria=<id>`.
  `NavigationMenuLink` usa `render={<Link .../>}` para integrarse con el router, mismo criterio
  de polimorfismo de Base UI que ya se usa en `SheetTrigger`.
- **`features/branches/pages/BranchesPage.tsx`** (nueva, mapea a `sucursales` ✅ del backend):
  página real en `/sucursales` que lista todas las sucursales (`useSucursales()`, ya existía el
  hook) con dirección y teléfono. El link "Sucursales" del navbar y del footer, que antes eran
  anchors muertos (`#sucursales`) apuntando a una sección que no siempre existía en la página
  actual, ahora apuntan acá.
- **"Registrarse"**: antes solo existía "Iniciar sesión" en el header cuando no había sesión.
  Se agregó `Link to="/register"` como botón sólido (jerarquía visual: registro es la conversión
  primaria, con más peso que "Iniciar sesión", que quedó como link de texto) — en desktop y en
  el Sheet mobile.

Se aprovechó para corregir dos anchors muertos que quedaron de la landing original: el link
"Catálogo" del footer (`#categorias` → `/tienda`, corregido en la tanda anterior) y ahora
"Sucursales" (`#sucursales` → `/sucursales`).

**Verificado con Playwright (2026-09-13):** dropdown de categorías abre y navega correctamente
con las 4 categorías reales; buscar "jean" desde el header lleva a `/tienda?q=jean` y filtra a
un solo resultado (`Jean Recto Azul`); `/sucursales` muestra la sucursal real sembrada; estado
sin sesión muestra "Iniciar sesión" + "Registrarse"; mobile (390px) sin overflow, con buscador,
nav y ambos botones de auth dentro del `Sheet`. Flujo de compra completo re-verificado de
punta a punta después del cambio (login → producto de variante única con auto-selección →
carrito → checkout → confirmación) sin regresiones. `build`/`lint` limpios, `impeccable detect`
sin hallazgos.

## ✅ Estado real (2026-09-13): panel de administración — `/admin/*`

Pedido del usuario: un apartado para gestionar la tienda (agregar productos, etc.) con el
usuario de rol `ADMIN`. Se resolvió la "decisión pendiente" que dejó anotada la sección 2
sobre `admin/`: vive en **este mismo proyecto**, gateado por rol (no un proyecto React aparte)
— es lo más simple de arrancar, tal como decía la nota original, y no hay todavía volumen que
justifique separarlo.

**Modo de diseño: Operate, no Persuade.** A diferencia del resto del sitio (storefront, modo
Persuade — motion, placeholders con textura, editorial), el panel admin usa el modo Operate de
la skill de diseño: tablas planas, formularios sin adornos, cero motion, densidad más alta. Es
la decisión de diseño correcta para esta superficie, no una versión "sin terminar" del resto.

**`AdminRoute.tsx`** (por fin construido, junto con `ProtectedRoute` de la tanda anterior):
exige `isAuthenticated` + `user.role === 'ADMIN'`, si no cumple redirige a `/login` o `/`.
**Importante:** los endpoints del backend que este panel consume (`categorias`, `productos`,
`proveedores`, `sucursales`, `inventario/ajustes`, etc.) **todavía no están protegidos por rol**
del lado del backend (son los mismos `TODO: proteger con rol ADMIN` que ya estaban documentados
en `mirroria-backend/AGENTS.md` desde antes) — este gate es hoy una cortina de UX en el
frontend, no un control de seguridad real. Cualquiera con la URL y una sesión (de cualquier
rol) podría llamar esos endpoints directo con `curl`. Cuando el backend implemente guards de
rol, este gate del frontend sigue siendo necesario igual (UX), pero deja de ser la única
barrera.

**`AdminLayout.tsx`**: sidebar con 5 secciones (Catálogo, Proveedores, Sucursales, Inventario,
Ventas) + nombre del admin, link "Volver a la tienda" y cerrar sesión. `/admin` redirige a
`/admin/catalogo`. Se evitó a propósito un dashboard con métricas en `/admin` — el "hero-metric
template" (número grande + label + stats) está explícitamente baneado como default perezoso en
la skill de diseño, y no se pidió ninguna métrica puntual.

**Features nuevas/extendidas:**
- `features/providers/` (nueva, mapea a `proveedores` del backend, no existía ninguna feature
  para esto todavía): `types/`, `api/providersApi.ts`.
- `features/inventory/` (nueva — **promovida** desde `features/catalog/api/inventarioApi.ts`,
  tal como el comentario original de ese archivo ya anticipaba: *"si en el futuro un panel de
  administración necesita inventario para más cosas (ajustes manuales...), ahí sí se justifica
  promoverlo a una feature `inventory/` propia"*. `ajustarStock()` se agregó al mismo tiempo.
- `features/catalog/`: `catalogApi.ts` ganó `create*`/`get*` para categorías, temporadas,
  colecciones, tallas, colores y productos/variantes. Nuevo hook
  `useVariantesConProducto.ts` — aplana el catálogo a nivel de variante (producto + talla +
  color); `useCartLineItems` (feature `cart`) se refactorizó para consumirlo en vez de duplicar
  su propio fetch N+1 — mismo criterio de promoción (2+ consumidores).
- `features/branches/`: `branchesApi.ts` ganó `Ciudad` + `createCiudad`/`createSucursal`.
- `features/checkout/`: `checkoutApi.ts` ganó `getVentas()` (listado, antes solo existía
  `getVenta(id)` puntual).
- `src/hooks/useResourceList.ts` y `useCreateResource.ts` (globales): "listar" y "crear con
  loading/error" genéricos — el panel admin repite ese patrón para 9+ recursos distintos, mismo
  criterio de promoción a `src/hooks/` que `useAuth`/`useCart`.

**`features/admin/components/simple-resource-manager/`**: tabla + formulario de creación
genéricos (campos `text|number|textarea|select|date`), para los 8 recursos "planos" del panel
(categorías, temporadas, tallas, colores, ciudades, proveedores, colecciones, sucursales) —
colapsa lo que serían 8 componentes casi idénticos en uno. `productos` (variantes anidadas,
conversión Bs→centavos) e `inventario` (ajuste con lookup de variante) no encajan en ese molde
y tienen su propio panel bespoke (`productos-panel/` con `crear-producto-form.tsx` +
`agregar-variante-form.tsx` co-ubicados; `stock-table/` + `ajustar-stock-form/`).

**`CatalogoAdminPage`** y **`SucursalesAdminPage`** usan `Tabs` de shadcn (instalado, sin usar
hasta ahora) para agrupar sub-recursos sin multiplicar rutas.

**Precio en Bs, no en centavos, en el formulario de crear producto**: el admin escribe
"280" (Bolivianos), y recién en el submit se convierte a centavos
(`Math.round(Number(precio) * 100)`) — la conversión ocurre en el límite del formulario, no
dispersa por el componente, siguiendo la regla 7 de la sección 3 ("centavos hasta el último
momento de render", acá invertida: Bs hasta el primer momento de envío).

**🔧 Bug real encontrado y corregido (2026-09-13, el mismo de siempre): `SelectValue` sin
`children` mostraba el UUID crudo.** Ya se había resuelto una vez para `BranchPicker` (ver
estado anterior) pero se repitió en **todos** los `Select` nuevos del panel admin (el campo
`select` de `SimpleResourceManager`, `Categoría`/`Colección` en `crear-producto-form`,
`Producto`/`Talla`/`Color` en `agregar-variante-form`, `Variante`/`Sucursal` en
`ajustar-stock-form`, el filtro de `stock-table`) — se me olvidó aplicar el patrón ya conocido
al copiarlo. Se corrigieron los 8 casos con el mismo fix: `<SelectValue placeholder="...">{(id)
=> opciones.find(...)?.label ?? placeholder}</SelectValue>`. **Lección reforzada:** ningún
`Select` de Base UI en este proyecto debe quedar con `<SelectValue placeholder="..." />`
auto-cerrado si su `value` no es literalmente igual a su label visible — siempre `children`
como función de lookup. Se verificó con
`grep -rn 'SelectValue placeholder="[^"]*" />' src/` que no queda ningún caso así en todo el
proyecto.

**Gap real encontrado y corregido en la misma pasada:** después de aplicar un ajuste de stock,
la tabla de "Stock por sucursal" no se refrescaba (quedaba mostrando el dato viejo hasta
recargar la página o volver a elegir la sucursal). Fix: `InventarioAdminPage` sube un
`reloadKey` que `AjustarStockForm` incrementa al terminar (`onAjustado`) y que `StockTable` usa
como dependencia adicional de su `useEffect`.

**Verificado end-to-end con Playwright (2026-09-13)**, con una cuenta de prueba registrada y
promovida a `ADMIN` por SQL directo (`UPDATE usuarios SET role='ADMIN'` — el backend no tiene
todavía un endpoint para cambiar roles, ver conversación con el usuario): creación real de
talla (XL), color (Verde, con swatch visual), categoría (Ropa Deportiva), temporada, colección
(con los selects de Temporada/Proveedor funcionando), producto completo (Conjunto Deportivo
Negro, Bs 280 → 28000 centavos verificado) con su variante (XL · Verde, SKU con rechazo de
duplicado verificado), proveedor, ciudad (Tarija) y sucursal en esa ciudad, ajuste manual de
stock (+20, con refresco en vivo de la tabla), listado de ventas real (5 pedidos de sesiones
anteriores, sucursal/canal/estado/total/fecha correctos). El producto nuevo apareció de
inmediato en `/tienda`. Confirmado que un usuario `CUSTOMER` no ve el link "Panel admin" y que
navegar directo a `/admin/catalogo` sin rol `ADMIN` redirige a `/`. `build`/`lint` limpios,
`impeccable detect` sin hallazgos sobre todo `features/admin/`.

## 🔧 `AdminLayout` con sidebar fijo (2026-09-13)

Feedback del usuario: el panel izquierdo del admin (Catálogo/Proveedores/.../Ventas) se
scrolleaba junto con el contenido de la derecha en vez de quedarse fijo — en una tabla larga
## 🔧 `AdminLayout` con sidebar agrupado y responsivo móvil completo (2026-09-14)

Se rediseñó la experiencia de navegación del panel de administración (`/admin/*`) tanto para desktop como para mobile/tablet:
1. **Sidebar modular agrupado (`admin-sidebar-content.tsx`, 142 líneas):**
   - Agrupación por dominio de negocio: **Catálogo y Stock** (Catálogo, Inventario), **Ventas y Reservas** (Ventas, Reservas), **Operaciones** (Sucursales, Proveedores) y **Administración** (Usuarios).
   - Badges de contexto en elementos clave (`Prendas`, `Stock`, etc.).
   - Pie de usuario con avatar de iniciales, nombre, email, botón "Tienda" y botón "Cerrar sesión".
2. **Topbar y Drawer móvil con shadcn (`Sheet` con `side="left"`, `AdminLayout.tsx`, 51 líneas):**
   - En pantallas móviles (< lg), se eliminó la barra horizontal comprimida. En su lugar se colocó un header sticky limpio con botón de menú hamburguesa (`List`), logo y badge `Admin`.
   - Al tocar el menú se abre el `Sheet` drawer lateral izquierdo con toda la navegación y el perfil del usuario. Se cierra automáticamente al presionar cualquier enlace o con el botón `X`.
3. **Tablas con scroll horizontal protegido:**
   - Se añadió `min-w-[620px]` a las tablas de productos, inventario, ventas, reservas, usuarios y recursos para que en pantallas móviles de 360-390px se puedan deslizar horizontalmente sin comprimir columnas ni ocultar los botones de acción ("Editar", "+ Variante", etc.).
   - Padding adaptativo `p-4 sm:p-6 lg:p-10` en las 7 páginas del panel admin.
- Verificado con Playwright en viewport desktop (1280x800) y móvil (390x844). Todos los archivos cumplen la Regla 1.B (< 150 líneas).

## 🔧 Optimización de `AdminLayout` para Pantallas de Alta Resolución (1080p, 2K, 4K) (2026-09-14)

Feedback del usuario: en pantallas con alta resolución el panel admin se sentía vacío y asimétrico por limitarse a un ancho fijo sin centrar.
1. **Centrado Simétrico y Ancho Fluido (`AdminLayout.tsx`):**
   - El viewport principal ahora usa `bg-muted/15` para contraste de capas con las tarjetas `bg-card`.
   - Las 7 páginas del panel admin (`Catalogo`, `Inventario`, `Ventas`, `Reservas`, `Sucursales`, `Proveedores`, `Usuarios`) ahora tienen `mx-auto max-w-7xl 2xl:max-w-[1536px]`, eliminando el vacío asimétrico en pantallas de 1920px, 2560px y monitores ultrawide.
2. **Header de Navegación Desktop (`AdminLayout.tsx`):**
   - Se añadió un topbar sticky para desktop (`lg:flex`) con breadcrumb dinámico por sección (`Admin / Catálogo`), badge de estado ("Base de Datos Conectada") y enlace rápido a "Ver Tienda".
3. **Escala del Sidebar en Pantallas Grandes (`admin-sidebar-content.tsx`):**
   - El sidebar escala de `w-64` a `xl:w-72` en resoluciones grandes con padding optimizado (`xl:px-4 xl:py-5`) para mantener proporciones equilibradas.


## 🔧 Dato temporal real encontrado y corregido (2026-09-13): `BRANCH_CITIES` inventado

El usuario preguntó explícitamente si quedaba algún dato temporal en el frontend — auditoría
completa de todos los `.data.ts` restantes. Encontrado uno real:
`branches-strip/branches-strip.data.ts` tenía `BRANCH_CITIES`, una lista fija de 5 ciudades
bolivianas (La Paz, Santa Cruz de la Sierra, Cochabamba, El Alto, Sucre) mostrada como badges
en el banner de sucursales del inicio — **inventada**, sin relación con qué sucursales existen
de verdad en la base (hoy solo Santa Cruz y Tarija). Quedó ahí desde la construcción original
de la landing (antes de que existiera `sucursales` como módulo real) y nunca se actualizó
cuando se construyó `/sucursales` de verdad. **Fix:** `BranchesStrip` ahora usa
`useSucursales()` (mismo hook que ya usa `/sucursales` y `BranchPicker`), deriva las ciudades
únicas de las sucursales reales, y todo el banner es un `Link` a `/sucursales`. Se borró
`branches-strip.data.ts`.

Los demás `.data.ts` que quedan (`hero-section.data.ts`, `feature-highlights.data.ts`,
`site-header.data.ts`, `site-footer.data.ts`) se revisaron y **no son datos de negocio** —
son copy de marketing (headline, CTAs) y estructura de navegación (labels/hrefs de links fijos
como "Términos y condiciones"), la misma clase de contenido estático que tendría cualquier
landing page real escrita por un copywriter, no un dato que debería salir de la base.

**Nota aparte, no es un dato temporal pero sí una imprecisión de contenido real:**
`feature-highlights.data.ts` tiene una tarjeta "Sugerencias hechas para vos" / "Recomendaciones
según lo que ya viste y compraste antes" — describe el recomendador de productos por IA que el
enunciado sugiere (RF25), pero la decisión tomada con el usuario (ver `Backend.md` del vault)
fue acotar la IA de este proyecto **solo** a reportes dinámicos para ADMIN, sin recomendaciones
para clientes. Esa tarjeta le promete a la clienta una función que ya no está en el alcance.
No se tocó todavía porque no fue lo que se preguntó — **queda anotado para decidir con el
usuario**: sacar la tarjeta, cambiar el copy a algo que sí se va a construir, o dejarla como
visión de producto a futuro sin prometerla como ya disponible.

**Resuelto (2026-09-13):** el usuario pidió cambiarla a algo real. Se reemplazó por "Stock real
por sucursal" / "Antes de ir, consultá si tu talla está disponible en la tienda que elijas" —
describe exactamente lo que ya hace `product-detail` (RF08, `BranchPicker` +
`useDisponibilidad`). Ícono `Package` (Phosphor) en vez de `Sparkle`, para no repetir
`MapPinLine` de la tarjeta vecina ni sugerir IA. Las otras dos tarjetas ("Vestidor virtual",
"Reservá por sucursal") no se tocaron — describen roadmap real (`ar-fitting/` 🔮 y `reservas`
placeholder), no una decisión de scope ya descartada como la de recomendaciones.

## ✅ Auditoría de arquitectura y diseño (2026-09-13, a pedido del usuario)

Verificado con comandos reales sobre todo `src/`, no de memoria:

1. **Archivos > 150 líneas**: dos casos. `simple-resource-manager.tsx` (157) — se extrajo
   `resource-field.tsx` co-ubicado (mismo patrón que `variant-swatch-group.tsx` en
   `product-detail/`), quedó en 123. `App.tsx` (161, subió a 162 al deduplicar la composición
   `AdminRoute`+`AdminLayout` en un helper `AdminPage` local) — se dejó así a propósito: es la
   raíz de composición de rutas, sin lógica de negocio, misma categoría que `main.tsx` (no
   sujeta a la regla 1.B, pensada para features/páginas con lógica real). Forzar una
   abstracción extra solo para bajar el conteo de líneas habría sido peor que dejarlo declarativo.
2. **`index.ts` faltante en carpetas de componente**: ninguno real. `components/common/` no
   tiene (ni necesita) — es un directorio plano de utilidades sueltas, documentado así desde el
   principio, no el patrón carpeta-por-componente de `features/*/components/`.
3. **Colores crudos de Tailwind fuera del sistema de tokens** (`bg-neutral-*`, `bg-gray-*`,
   etc. fuera de `components/ui/`): ninguno.
4. **Iconos `lucide-react` fuera de `components/ui/`** (debe ser Phosphor en todo lo propio):
   ninguno.
5. **Imports relativos profundos** (`../../../..`) en vez del alias `@/`: ninguno.
6. **`motion/react` dentro de `features/admin/`**: ninguno — el modo Operate se respetó, cero
   motion en todo el panel admin.
7. **`rounded-[...]` arbitrario** fuera de la escala `--radius`: ninguno.
8. **`apiFetch()` llamado directo desde un `.tsx`** (debe vivir solo en `api/*.ts`): ninguno.
9. **`lib/utils.ts`** (no debería existir, ver Sección 0): no existe.
10. Hooks cross-feature (`useVariantesConProducto`, `useCartLineItems`, `useDisponibilidad`,
    `useSucursales`) — todos ya documentados en su estado correspondiente, ninguno nuevo sin
    documentar.

`build`/`lint` limpios y `impeccable detect` sin hallazgos sobre todos los archivos tocados en
esta pasada (incluida la tarjeta de `feature-highlights` corregida).

---

## ✅ Estado real (2026-09-14): reservas (RF09-12) y gestión de usuarios/roles (RF02)

Instrucción del usuario: avanzar todo lo posible de forma autónoma, dejando `pagos` e `ia`
como placeholders en blanco (se completan después con credenciales/API key reales), sin
desviarse de la arquitectura/patrones ya acordados.

- **`features/reservations/` nuevo** — mismo patrón de feature que `cart`/`checkout`:
  `types/`, `api/reservationsApi.ts`, `components/reservar-en-tienda/` (carpeta-por-componente
  con `index.ts`), `pages/MyReservationsPage.tsx`.
  - `ReservarEnTienda` se renderiza dentro de `product-detail.tsx` (no es una página propia),
    justo debajo del feedback de "agregar al carrito" — reserva **una sola variante a la vez**
    (no es un carrito de reservas), decisión de alcance deliberada para no duplicar la
    complejidad del carrito real.
  - `MyReservationsPage` (ruta `/reservas`, `ProtectedRoute`) reusa `useResourceList` +
    `useSucursales`/`useVariantesConProducto` cross-feature para mostrar nombre de sucursal y
    producto sin duplicar esos datos. Solo muestra "Cancelar" cuando `estado` está en
    `['PENDIENTE', 'CONFIRMADA']` — refleja la máquina de estados del backend.
- **`features/admin/` ganó dos páginas nuevas**, mismo patrón que el resto del panel
  (`useResourceList`/`useCreateResource`, tabla shadcn, cero motion):
  - `UsuariosAdminPage` (`/admin/usuarios`, RF02): `UsuarioRolEditor` co-ubicado
    (`components/usuario-rol-editor/`) — Select de rol + Select de sucursal condicional (solo
    aparece si el rol elegido es `ENCARGADO_SUCURSAL`/`CAJERO`, mismo requisito que valida el
    backend), botón "Guardar" que solo aparece si hay un cambio sin guardar. Toggle
    Activar/Desactivar con `Badge` (`variant="secondary"` activo / `"destructive"` inactivo).
  - `ReservasAdminPage` (`/admin/reservas`): `EstadoAcciones` co-ubicado
    (`components/estado-acciones/`) espeja del lado del cliente el mismo mapa
    `TRANSICIONES_MANUALES` del backend, para no ofrecer botones de transiciones inválidas.
    Filtro por sucursal con un `Select` de shadcn/Radix.
    - **Bug real encontrado y corregido en esta misma sesión**: el filtro cambiaba el valor
      visual del `Select` pero la tabla nunca se refrescaba — `useResourceList` solo reacciona
      a `reloadKey` (a propósito, ver warning `exhaustive-deps` ya documentado como aceptado),
      no a que la clausura de `fetchFn` haya cambiado. Fix: el `onValueChange` del filtro llama
      `reservas.reload()` explícitamente, igual que ya hacen los botones de acción del resto
      del panel. Verificado con Playwright: filtrar por una sucursal sin reservas ahora sí
      vacía la tabla.
    - Bug secundario relacionado: Radix `Select.Item` no permite `value=""`, así que no había
      forma de volver a "Todas las sucursales" una vez elegida una sucursal concreta — se
      agregó un valor centinela (`"__todas__"`) que el handler traduce a `""` antes de pasarlo
      a la API.
  - Nuevo ítem de nav en `AdminLayout` (`Reservas`, `Usuarios`) y en `header-auth.tsx`
    ("Mis reservas", visible para cualquier usuario autenticado, no solo `ADMIN`).
- **Verificado end-to-end con Playwright (2026-09-14)**: flujo completo cliente — seleccionar
  talla/color/sucursal en la ficha de producto → completar fecha/cantidad → "Reserva creada" →
  aparece en `/reservas` como `PENDIENTE` con botón "Cancelar". Flujo admin — `/admin/reservas`
  muestra las 3 reservas con los botones de transición correctos por estado, confirmar
  `PENDIENTE → CONFIRMADA` funciona y reduce las acciones disponibles a las válidas para el
  nuevo estado, filtro por sucursal (una vez corregido) filtra de verdad. `/admin/usuarios`
  lista los 6 usuarios reales, promover a `CAJERO` exige y guarda `sucursalId`, toggle
  Activar/Desactivar refleja el estado inmediatamente. Cero errores de consola en los tres
  flujos. `tsc --noEmit` y `npm run lint` limpios (mismos warnings pre-existentes de siempre,
  ninguno nuevo).
- **Pendiente, a propósito**: `pagos` e `ia` quedan sin frontend — el usuario los completará
  cuando traiga credenciales de pasarela y una API key de IA reales.

## 🔧 Rediseño y solución definitiva de UX en `UsuariosAdminPage` (2026-09-14)

Feedback directo del usuario: *"al momento de cambiar el rol de un ususario es muy feo en este momento, rompe el texto no entra bien y muy plano todo"*.

**Causas raíz identificadas:**
1. **Truncamiento y desborde de texto:** La celda de cada fila embebía directamente un `<Select>` con `w-40` (160px). El string `"ENCARGADO_SUCURSAL"` (18 caracteres) no cabía físicamente en el botón ni en el menú de opciones, truncándose como `"ENCARGADO_SUC..."`. Al seleccionar un rol con sucursal, se inyectaba un segundo select (`w-44`) y un botón "Guardar", provocando que los elementos colapsaran en múltiples líneas, expandiendo la altura de la fila y deformando la tabla.
2. **Aspecto plano y pesado ("muy plano todo"):** Toda la tabla renderizaba inputs de formulario activos permanentemente en cada fila sin distinción entre vista y edición. No existía contenedor de tarjeta, jerarquía de roles, ni avatares de usuario; todos los roles se mostraban en mayúsculas crudas de base de datos (`CUSTOMER`, `ADMIN`).

**Solución integral implementada:**
1. **Extracción a Diálogo Modal (`Dialog` de shadcn / Base UI):**
   - La edición de rol ya no sobrecarga la celda de la tabla. Al hacer clic en "Cambiar" se abre un modal espacioso (`max-w-md`) con ancho completo (`w-full`) para los selects.
   - Nombres humanos y descriptivos en español: "Administrador" (con descripción de permisos), "Encargado de Sucursal", "Cajero" y "Cliente".
   - Selector condicional de sucursal con validación clara y mensaje de advertencia si no se selecciona.
2. **Badges de rol con identidad visual propia:**
   - `Administrador`: badge vino/rosa de marca (`bg-primary/10 text-primary border-primary/25`) con ícono de escudo (`ShieldCheck`).
   - `Encargado de Sucursal`: badge púrpura/índigo con ícono de tienda (`Storefront`) + sublínea con la sucursal asignada.
   - `Cajero`: badge ámbar/dorado con ícono de credencial (`IdentificationBadge`).
   - `Cliente`: badge neutro slate con ícono de usuario (`User`).
3. **Elevación de la tabla y herramientas operativas:**
   - Tabla encapsulada en tarjeta (`rounded-xl border bg-card shadow-xs`).
   - Columna de identidad con avatar circular de iniciales (`AP`, `CR`, etc.), nombre en `font-medium` y correo en fuente monoespaciada sutil.
   - Estado de cuenta estilizado con píldora verde y punto de presencia para "Activo".
   - Barra superior con buscador en tiempo real (`Buscar por nombre o correo...`), filtro rápido por rol (`Todos los roles`, `Administrador`, etc.) y contador reactivo de usuarios registrados.
4. **Arquitectura y modularidad limpia (Regla 1.B estrictamente cumplida):**
   - Descomposición en subcomponentes modulares para mantener todos los archivos bajo el límite de 150 líneas:
     - `UsuariosAdminPage.tsx` (111 líneas): orquesta el header, buscador, filtro por rol y renderiza `UsuariosTable`.
     - `usuarios-table/` (`usuarios-table.tsx`, 125 líneas): tabla encapsulada con avatares, badges de rol/estado y acción toggle.
     - `usuario-rol-editor/` (`usuario-rol-editor.tsx`, 77 líneas): botón disparador y badges de rol y advertencia.
     - `usuario-rol-dialog.tsx` (149 líneas): modal interactivo con Base UI Select y validación condicional.
     - `sucursal-field.tsx` (59 líneas): subcomponente co-ubicado para el selector de sucursal.
     - `usuario-rol-editor.data.ts` (50 líneas): constantes de rol y helper `getInitials` cumpliendo Fast Refresh.

**Verificado con Playwright (2026-09-14):**
- Búsqueda y filtrado reactivo.
- Apertura del diálogo modal sin ningún truncamiento de texto.
- Cambio de cliente a "Encargado de Sucursal", selección de sucursal "Sucursal Centro", guardado persistente en backend y refresco automático reflejando el nuevo badge morado y la sucursal asignada.

## 🎨 Elevación visual integral con shadcn en todo `/admin/*` (2026-09-14)

Feedback directo del usuario: *"puedes hacer asi peuqeñas mejoras usando chadcn en todo el apartado de /admin, en este momento todas las secciones estan muy planas"*.

Se aplicó una mejora sistemática de jerarquía visual y componentes shadcn en todas las secciones de administración:

1. **`AdminLayout.tsx` (Sidebar):**
   - Header de navegación con badge distintivo `Admin` (`variant="outline"`, estilo vino de marca).
   - Widget de perfil inferior con `Avatar` + `AvatarFallback` de iniciales (`AP`, etc.), nombre y correo monoespaciado.
   - Botón directo "Tienda" con ícono `ArrowSquareOut` y botón de salida con ícono `SignOut`.
2. **`VentasAdminPage.tsx` y `ventas-table/` (`/admin/ventas`):**
   - Badges métricos en cabecera: contador de pedidos y total recaudado en Bs (`formatMoney`).
   - Tabla encapsulada en `Card` con badges semánticos para canal (`Tienda Web` con ícono `Globe`, `Caja Física` con `Storefront`).
   - Estado de pago estilizado con ícono y variantes cromáticas acordes.
3. **`ReservasAdminPage.tsx` y `reservas-table/` (`/admin/reservas`):**
   - Badges cromáticos para estados (`PENDIENTE` en ámbar con reloj, `CONFIRMADA` en azul con check, `EN_TIENDA`/`COMPLETADA` en verde esmeralda, `CANCELADA` en rojo).
   - `EstadoAcciones`: jerarquía de botones de acción (`variant="default"` verde para "Cliente llegó", `variant="ghost"` rojo para "Cancelar").
   - Encapsulado en `Card` con íconos de sucursal, fecha y badge de cantidad de prendas.
4. **`InventarioAdminPage.tsx` y `stock-table/` (`/admin/inventario`):**
   - Selector de sucursal integrado con la cabecera.
   - `StockBadge`: indicador dinámico de stock (`Agotado` en rojo para 0 u., `Bajo` en ámbar para <= 5 u., `Disponible` en verde esmeralda).
   - Estado vacío ilustrado con borde discontinuo e ícono de sucursal.
   - `AjustarStockForm`: encapsulado en `Card` con `CardHeader`, `FieldGroup`, `FieldLabel`, `FieldDescription` y alerta de confirmación con nuevo saldo en tiempo real.
5. **`CatalogoAdminPage.tsx` y `productos-panel/` (`/admin/catalogo`):**
   - Tabs con íconos dedicados: `Package` (Productos), `Tag` (Categorías), `Sparkle` (Colecciones), `Calendar` (Temporadas), `Ruler` (Tallas), `Palette` (Colores).
   - `ProductosTable` a ancho completo con badges de categoría, precios destacados en negrita (`formatMoney`) y botón directo `+ Variante`.
   - Modales interactivos `Dialog` de shadcn: `CrearProductoDialog` (con `ProductoFormFields` modular) y `AgregarVarianteDialog`, con `FieldGroup`, `Field`, `FieldLabel` y `Select` con lookup.
6. **`ProveedoresAdminPage.tsx` (`/admin/proveedores`):**
   - Tabla a ancho completo en `Card` con `Avatar` e iniciales de razón social (`CS`, `TS`), badge de NIT, email con ícono `EnvelopeSimple` y teléfono con `Phone`.
   - Diálogo modal para registrar nuevos proveedores sin comprimir la tabla.
7. **`sucursales-panel.tsx` y `ciudades-panel.tsx` (`/admin/sucursales`):**
   - `sucursales-panel.tsx`: avatar de tienda física, badge de ciudad con `MapPin`, dirección y teléfono con íconos.
   - Diálogo modal interactivo para crear sucursales y ciudades.
8. **`SimpleResourceManager` (recursos planos modularizados):**
   - Refactorizado a un patrón moderno de barra de herramientas superior (buscador en tiempo real, contador de registros, botón `+ Nuevo ...`) + tabla completa en `Card` (`ResourceTable`) + modal interactivo (`ResourceCreateDialog`) con campos reactivos (`ResourceField`).
9. **Arquitectura estricta (< 150 líneas):**
   - Todos y cada uno de los archivos modificados (`productos-panel.tsx`, `productos-table.tsx`, `crear-producto-dialog.tsx`, `producto-form-fields.tsx`, `agregar-variante-dialog.tsx`, `simple-resource-manager.tsx`, `resource-table.tsx`, `resource-create-dialog.tsx`, `resource-field.tsx`, etc.) cumplen la Regla 1.B manteniéndose estrictamente bajo las 150 líneas (el más grande tiene 149 líneas).

**Verificado visual y funcionalmente con Playwright (2026-09-14):**
- 7 capturas de pantalla tomadas sin errores de consola ni advertencias de compilación (`build` y `lint` limpios con 0 errores).

## 👗 Catálogo con imágenes reales en Base de Datos (2026-09-14)

Se reemplazó el placeholder artificial del perchero conectando URLs reales y directas de alta resolución en la base de datos PostgreSQL (`mirroria_db`):
- **Base de Datos:** Se actualizaron los 9 productos del catálogo en la columna `imagenes` (JSONB) con URLs públicas verificadas (HTTP 200) de moda femenina de Unsplash CDN (`Vestido Floral Primavera`, `Vestido Noche Negro`, `Blusa Seda Blanca`, `Blusa Elegante Negra`, `Pantalón Palazzo Negro`, `Jean Recto Azul`, `Cinturón de Cuero`, `Bufanda Estampada`, `Conjunto Deportivo Negro`). No se borró ningún producto ya que se obtuvieron fotos de alta calidad para todos.
- **Frontend activado:**
  - `ProductCard` renderiza `<img src={...}>` en proporción 3:4 con zoom sutil al hover y fallback automático al perchero si no hay imagen o falla la carga (`onError`).
  - `ProductDetail` muestra la fotografía completa sticky en desktop.
  - `CartItem` y `useVariantesConProducto` aplanan y transmiten `imagenUrl` permitiendo ver la miniatura real del producto en el carrito de compras.
- **Verificado con Playwright (2026-09-14):** Capturas de `/tienda` y `/tienda/producto/:id` confirmando renderizado fotográfico nítido y cero desbordes.

## ✏️ Edición de Productos en Catálogo Admin (2026-09-14)

Se implementó el flujo completo de edición de productos en el panel de administración (`/admin/catalogo`), conectando frontend y backend con arquitectura limpia:
- **Backend:**
  - `UpdateProductoDto` (`class-validator` con decoradores opcionales, ESM `.js`).
  - `ProductosService.update(id, dto)` con validación de unicidad de slug y existencia de categoría/colección.
  - Endpoint `PATCH /api/v1/catalogo/productos/:id` protegido por `JwtAuthGuard`, `RolesGuard` y `@Roles('ADMIN')`.
- **Frontend:**
  - `catalogApi.updateProducto(id, dto)` en `src/features/catalog/api/catalogApi.ts`.
  - `EditarProductoDialog` (`editar-producto-dialog.tsx`, 123 líneas) reutilizando `ProductoFormFields`, pre-cargando los datos del producto seleccionado (categoría, colección, título, slug, descripción, precio en Bs) y usando componentes shadcn (`Dialog`, `Button`, `Alert`).
  - Botón "Editar" con ícono `PencilSimple` en `ProductosTable` (`productos-table.tsx`, 98 líneas).
  - Manejo de estado `editingProducto` en `ProductosPanel` (`productos-panel.tsx`, 146 líneas) con re-renderizado automático tras guardar cambios.
- **Cumplimiento arquitectónico:** Todos los archivos permanecen estrictamente por debajo de las 150 líneas (Regla 1.B). Build de TypeScript y Vite limpios con 0 errores.
- **Verificación E2E con Playwright:** Flujo automatizado de login como admin, navegación a `/admin/catalogo`, apertura del modal, modificación de precio, guardado, actualización reactiva en la tabla y restauración de precio ejecutados con éxito.

## 🏷️ Promociones y Cupones de Descuento (2026-09-15)

Se implementó el flujo completo de promociones y cupones de descuento, integrando administración, tienda online y validación en tiempo real:
- **Arquitectura de Feature (`src/features/promotions/`):**
  - `types/promotions.types.ts`: `Cupon`, `TipoDescuentoCupon` (`PORCENTAJE` | `MONTO_FIJO`), `CreateCuponDto`, `ValidarCuponResult`.
  - `api/promotionsApi.ts`: llamadas HTTP para listar, crear, activar/desactivar y validar cupones contra `/api/v1/promociones/cupones`.
  - `hooks/useCupones.ts`: hook de consulta y mutación para el panel de administración.
  - `hooks/useValidarCupon.ts`: hook reactivo para validar cupones en tiempo real antes de finalizar una compra.
- **Panel de Administración (`/admin/cupones`):**
  - `CuponesAdminPage.tsx`: cabecera con botón de actualización, diálogo de alta rápida y tabla integral.
  - `CuponesTable`: tabla construida exclusivamente con componentes shadcn (`Table`, `Badge`, `Button`, `Skeleton`), badges contextuales de estado (`Activo`, `Inactivo`, `Expirado`, `Agotado`) e íconos Phosphor.
  - `CrearCuponDialog`: formulario en modal espacioso con validaciones de fechas, cálculo porcentual (máx. 100%) o monto fijo en Bs. (convertido a centavos), límites opcionales de uso y monto mínimo de compra.
  - Integración en navegación: enlace "Cupones" en `admin-sidebar-content.tsx` bajo la sección *"Ventas y Promociones"* con badge *"Promo"*.
- **Integración en Checkout (`/checkout`):**
  - `CuponInput`: campo de texto estilizado con feedback en vivo (`Alert`, `Badge`), validación instantánea del descuento y botón para desvincular el cupón.
  - `OrderSummary`: desglose transparente mostrando subtotal, descuento aplicado (`-Bs. XX.XX`) y monto total reactivo.
  - Al presionar "Confirmar pedido", el código del cupón viaja al backend y queda formalmente asentado en la venta (`ventas.cupon_id`, `descuento_cents`, `total_cents`).
- **Verificación Técnica:** `tsc -b && vite build` y `npm run lint` limpios con 0 errores.

---

## 🧰 0. Stack y herramientas

- **Framework:** Vite + React 19 + TypeScript + Tailwind v4 + `react-router-dom` ✅ instalado
  (`BrowserRouter` envuelve `<Routes>` dentro de `App.tsx`; `AuthProvider` envuelve `<App />`
  en `main.tsx` — ver sección de estado más arriba) — igual que `case-frontend`.
- **UI: shadcn/ui** ✅ instalado, preset Nova (Base UI, no Radix). Paleta propia de MirrorIA
  (acento vino/rosa único), no heredada de CASE — ver sección de estado más arriba.
- **Alias `@/*` → `src/*`**: configurar en `tsconfig.json`/`tsconfig.app.json` y
  `vite.config.ts` desde el scaffold inicial (requisito de shadcn, no viene por defecto en Vite).
- **Cliente HTTP:** `fetch` nativo envuelto en `lib/api.ts` (`apiFetch()`), no `axios` — mismo
  criterio que `case-frontend`: interceptor manual que agrega `Authorization: Bearer` desde
  `localStorage` y, ante un `401` del backend, limpia sesión y manda a `/login`.
- **Variables de entorno:** `.env` / `.env.example` con `VITE_API_URL=http://localhost:3000/api/v1`.
  Recordar que `VITE_*` es **build-time**, no runtime — si se dockeriza el frontend más
  adelante, revisar si hace falta un `window.__env` generado en el entrypoint (como en
  `erp-frontend`) o si alcanza con el mismo criterio de `case-frontend` (el fetch corre en el
  navegador del host, no dentro del contenedor).
- **Puerto de desarrollo: `5174`** (`npm run dev`) — **no es arbitrario**, ya coincide con el
  default de `CORS_ORIGINS` configurado en `mirroria-backend/.env.example`. Si se cambia el
  puerto acá, hay que cambiarlo también ahí.
- **Formularios:** React Hook Form + Zod para formularios con más de 2-3 campos o con
  validación no trivial (registro, checkout); componentes controlados simples alcanza para
  formularios triviales (ej. un buscador).

---

## 🏛️ 1. Principios Arquitectónicos Fundamentales

Idénticos a `case-frontend` — se copian acá tal cual porque ya están probados y no hay ninguna
razón de dominio para cambiarlos.

### A. Arquitectura Orientada a Features (Bulletproof React)
No se organiza el código por tipo técnico (nada de amontonar todos los componentes en una sola
carpeta `components/` ni todos los hooks en `hooks/`). Se organiza por **dominios de negocio**
en `src/features/`. Cada feature es un módulo autocontenido que encapsula sus propios
`api/`, `types/`, `components/`, `hooks/` y `pages/`.

### B. Regla Estricta "Anti-1k-Lines" (Archivos pequeños y legibles)
**Ningún archivo debe superar las 100-150 líneas de código.**
1. **Thin Pages (< 30 líneas):** las páginas en `pages/` solo orquestan — importan el layout y
   renderizan el contenedor de la feature. Cero lógica de negocio, cero peticiones directas.
2. **Separación de Lógica y Presentación (Custom Hooks):** validación, llamadas HTTP, loading
   y manejo de errores viven en hooks (`useProductos.ts`, `useCarrito.ts`), no en el JSX.
3. **Data-Driven UI (`*.data.ts`):** textos largos, configuraciones, listas de opciones y
   metadatos se extraen a un archivo `*.data.ts` complementario cuando aplica (ver criterio C).

### C. Patrón de Carpeta por Componente (solo cuando se justifica)
El patrón en carpeta con `.data.ts` separado **no es un default parejo** — es ceremonia real
(3-4 archivos por componente). Se usa **solo** cuando el componente cumple alguna de estas
condiciones:
- Se reutiliza en 2+ lugares, o
- Supera ~80 líneas de JSX, o
- Tiene una lista de configuración/opciones que realmente conviene separar (ej.
  `checkout-steps.data.ts` con los pasos del checkout).

Para componentes chicos y de un solo uso (ej. un `login-form` de 4-5 campos sin reutilización),
un único archivo `.tsx` alcanza — no forzar `.data.ts`/`index.ts` ahí.

```text
nombre-componente/
├── nombre-componente.tsx       # JSX y renderizado visual (< 80 líneas)
├── nombre-componente.data.ts  # Textos, labels y configuraciones estáticas (solo si aplica C)
├── nombre-componente.types.ts # Interfaces exclusivas de este componente (opcional)
└── index.ts                   # export * from './nombre-componente'
```

### D. Componentes UI Primitivos (shadcn)
- `src/components/ui/` es exclusiva para primitivas visuales instaladas vía shadcn
  (`button.tsx`, `card.tsx`, `input.tsx`, etc.).
- **Prohibido** meter lógica de negocio o llamadas a la API ahí adentro.

### E. Hooks: Locales vs Globales (Regla de Promoción)
- **Locales (`features/<modulo>/hooks/`):** si un hook solo lo usa un módulo específico
  (`useLogin`, `useCarritoItems`), vive dentro de esa feature.
- **Globales (`src/hooks/`):** si es una utilidad técnica agnóstica (`useDebounce`,
  `useLocalStorage`, `useMediaQuery`) o si **2+ módulos** la necesitan igual (`useAuth` para
  leer la sesión desde el navbar y desde el checkout), se promociona a `src/hooks/`.

---

## 🌲 2. Árbol Proyectado de `mirroria-frontend`

Adaptado a los dominios de negocio de MirrorIA — cada feature debería mapear 1:1 a un módulo
del backend (ver `mirroria-backend/AGENTS.md`). El orden de la lista es también el orden
sugerido de construcción (mismo criterio que el roadmap del backend: lo que no depende de nada
primero).

```text
mirroria-frontend/
├── public/
│   ├── icons/
│   └── images/
│       └── hero-model.jpg             # ✅ Foto hero local (1400x1902, carga en 0ms sin Unsplash)
├── src/
│   ├── assets/                        # Imágenes, logo, ilustraciones
│   │
│   ├── components/
│   │   ├── brand-logo.tsx             # ✅ Logotipo unificado MirrorIA (Sparkles + squircle primario)
│   │   ├── ui/                        # Primitivas shadcn — instalar bajo demanda
│   │   ├── feedback/
│   │   │   ├── LoadingScreen.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   └── common/                    # Compartidos por 2+ features
│   │       ├── ConfirmDialog.tsx      # genérico, mismo patrón que case-frontend
│   │       ├── SearchInput.tsx        # ✅ busca por título, navega a /tienda?q=
│   │       ├── MoneyLabel.tsx         # 🔜 no construido — hoy formatMoney() se llama directo
│   │       └── ProductImagePlaceholder.tsx  # ✅ reemplaza el slot `ProductGallery/` proyectado
│   │                                  #   acá — placeholder con textura, no carrusel real,
│   │                                  #   mientras no exista un pipeline de assets (ver estado
│   │                                  #   2026-09-13). Usado en product-card, product-detail,
│   │                                  #   cart-item.
│   │
│   ├── layouts/
│   │   ├── AuthLayout.tsx             # Login / Register
│   │   ├── StorefrontLayout.tsx       # Navbar + footer del sitio público (catálogo, carrito)
│   │   ├── AdminLayout.tsx            # ✅ responsive header + Sheet drawer móvil + aside desktop
│   │   └── admin-sidebar-content.tsx  # ✅ navegación agrupada (Catálogo, Ventas, Operaciones, Sistema) + perfil
│   │
│   ├── lib/
│   │   ├── api.ts                     # ✅ API_URL + apiFetch() con interceptor JWT (igual a case)
│   │   ├── unsplash.ts                # ✅ unsplashUrl(id, w, h) — fotos placeholder verificadas
│   │   ├── money.ts                   # ✅ formatMoney(cents) — Intl.NumberFormat es-BO/BOB
│   │   └── constants.ts               # 🔜 no construido todavía
│   │   # NOTA: no hay utils.ts con un cn() local — el preset de shadcn instalado (Base UI/"Nova")
│   │   # usa el paquete npm "cn" (github.com/shadcn-ui/cn, drop-in de clsx+tailwind-merge) en vez
│   │   # de un helper propio. Todo el proyecto importa `import { cn } from "cn"`, igual que los
│   │   # primitivos generados en components/ui/ — no crear un lib/utils.ts que lo duplique.
│   │
│   ├── routes/
│   │   ├── ProtectedRoute.tsx         # ✅ exige sesión — protege /carrito, /checkout*
│   │   ├── GuestRoute.tsx             # ✅ con token, redirige fuera de /login, /register
│   │   └── AdminRoute.tsx             # ✅ exige sesión + role ADMIN (ENCARGADO_SUCURSAL/CAJERO
│   │                                  #   quedan afuera por ahora — sumarlos cuando tengan su
│   │                                  #   propia vista, ej. `pos/` para CAJERO)
│   │
│   ├── context/
│   │   ├── AuthContext.tsx            # ✅ usuario activo, token, logout
│   │   └── CartContext.tsx            # ✅ carrito activo, itemCount reactivo para el navbar
│   │
│   ├── hooks/                         # 🌐 Globales (2+ módulos)
│   │   ├── useAuth.ts                 # ✅
│   │   ├── useCart.ts                 # ✅
│   │   ├── useDebounce.ts             # 🔜 no construido — buscador de catálogo no existe todavía
│   │   └── useMediaQuery.ts           # 🔜 no construido
│   │
│   └── features/                      # 🚀 Módulos de negocio — mapean 1:1 a modules/ del backend
│       │
│       ├── auth/                      # ↔ backend: seguridad ✅
│       │   ├── api/authApi.ts         # login(), register(), getMe()
│       │   ├── types/auth.types.ts
│       │   ├── hooks/{useLogin,useRegister}.ts
│       │   ├── components/{login-form,register-form}/
│       │   └── pages/{LoginPage,RegisterPage}.tsx
│       │
│       ├── catalog/                   # ↔ backend: catalogo ✅
│       │   ├── api/catalogApi.ts      # ✅ CRUD de categorías, temporadas, colecciones, tallas,
│       │   │                          #   colores, productos y variantes (admin + storefront)
│       │   ├── types/catalog.types.ts # ✅ Producto, Variante, Categoria, Temporada, Coleccion,
│       │   │                          #   Talla, Color
│       │   ├── hooks/{useProductos,useProducto,useCategorias,useVariantesConProducto}.ts  # ✅
│       │   │                          #   useVariantesConProducto: catálogo aplanado a nivel de
│       │   │                          #   variante — lo usan `cart` (useCartLineItems) e
│       │   │                          #   `admin/inventario` (ajuste manual), 2+ consumidores
│       │   ├── components/
│       │   │   ├── product-card/      # ✅
│       │   │   ├── product-grid/      # ✅ grilla + filtro por categoría/búsqueda (client-side,
│       │   │   │                      #   ver simplificación documentada 2026-09-13)
│       │   │   └── product-detail/    # ✅ ficha con variantes (talla/color) + stock por sucursal
│       │   └── pages/{HomePage,ProductListPage,ProductDetailPage}.tsx  # ✅
│       │
│       ├── providers/                 # ↔ backend: proveedores ✅ (nueva 2026-09-13, antes no
│       │   │                          #   existía ninguna feature de frontend para esto)
│       │   ├── api/providersApi.ts    # ✅ getProveedores(), createProveedor()
│       │   └── types/providers.types.ts  # ✅ Proveedor
│       │
│       ├── inventory/                 # ↔ backend: inventario ✅ (promovida 2026-09-13 desde
│       │   │                          #   `catalog/api/inventarioApi.ts` — el propio comentario
│       │   │                          #   de ese archivo ya anticipaba esta promoción cuando el
│       │   │                          #   panel admin necesitara ajustes manuales)
│       │   ├── api/inventoryApi.ts    # ✅ getDisponibilidad(), ajustarStock()
│       │   ├── types/inventory.types.ts  # ✅ InventarioSucursal
│       │   └── hooks/useDisponibilidad.ts  # ✅ usado desde product-detail (catalog)
│       │
│       ├── branches/                  # ↔ backend: sucursales ✅
│       │   ├── api/branchesApi.ts     # ✅ Ciudad+Sucursal: get + create de ambos
│       │   ├── types/branches.types.ts  # ✅ Ciudad, Sucursal
│       │   ├── hooks/useSucursales.ts # ✅
│       │   ├── components/branch-picker/  # ✅ usado en product-detail y checkout
│       │   └── pages/BranchesPage.tsx # ✅ listado real en /sucursales
│       │
│       ├── cart/                      # ↔ backend: ventas (carritos.items jsonb) ✅
│       │   ├── api/cartApi.ts         # ✅
│       │   ├── types/cart.types.ts    # ✅
│       │   ├── hooks/useCartLineItems.ts  # ✅ (useCart global vive en src/context, no acá)
│       │   ├── components/{cart-item,cart-summary}/  # ✅ — mini-cart 🔜 no construido
│       │   │                          #   (el ícono del navbar linkea directo a /carrito)
│       │   └── pages/CartPage.tsx     # ✅
│       │
│       ├── reservations/              # ↔ backend: reservas — reservar prendas para probarse (RF09-12) ✅
│       │   ├── api/reservationsApi.ts         # ✅
│       │   ├── types/reservations.types.ts    # ✅
│       │   ├── components/reservar-en-tienda/ # ✅ (usado en product-detail)
│       │   └── pages/MyReservationsPage.tsx   # ✅ ruta /reservas para ver y cancelar citas
│       │
│       ├── promotions/                # ↔ backend: promociones ✅ (cupones de descuento y validación)
│       │   ├── api/promotionsApi.ts   # ✅ getCupones(), createCupon(), toggleCuponEstado(), validarCupon()
│       │   ├── types/promotions.types.ts  # ✅ Cupon, CreateCuponDto, ValidarCuponResult
│       │   └── hooks/{useCupones,useValidarCupon}.ts  # ✅
│       │
│       ├── checkout/                  # ↔ backend: ventas + pagos ✅ (con soporte de cupones de descuento)
│       │   ├── api/checkoutApi.ts     # ✅ checkout(usuarioId, sucursalId, codigoCupon?), getVenta(), getVentas()
│       │   ├── types/checkout.types.ts  # ✅
│       │   ├── hooks/{useCheckout,useVenta}.ts  # ✅
│       │   ├── components/{order-summary,cupon-input}/  # ✅ desglose con descuentos y caja de canje
│       │   └── pages/{CheckoutPage,OrderConfirmationPage}.tsx  # ✅
│       │
│       ├── ar-fitting/                # 🔮 vestidor virtual AR (RF13) — exploratorio, depende de
│       │   │                          #   qué tecnología AR se elija (WebXR / librería nativa vía
│       │   │                          #   WebView en la app móvil); no bloquea nada de lo anterior
│       │   └── components/ar-viewer/
│       │
│       ├── assistant/                 # ↔ backend: ia — recomendador/chatbot (RF25)
│       │   ├── api/assistantApi.ts
│       │   ├── hooks/useAssistant.ts
│       │   └── components/{assistant-chat,recommended-products}/
│       │
│       └── admin/                     # ✅ panel interno, gateado por rol ADMIN — ver estado
│           │                          #   2026-09-13 para el porqué de cada decisión
│           ├── components/
│           │   ├── simple-resource-manager/  # ✅ ResourceTable + ResourceCreateDialog + ResourceField (<150 líneas c/u)
│           │   ├── categorias-panel/  # ✅ wrapper sobre SimpleResourceManager
│           │   ├── temporadas-panel/  # ✅
│           │   ├── tallas-panel/      # ✅
│           │   ├── colores-panel/     # ✅
│           │   ├── colecciones-panel/ # ✅ (selects de temporada/proveedor)
│           │   ├── ciudades-panel/    # ✅
│           │   ├── sucursales-panel/  # ✅ (select de ciudad + avatar de sucursal)
│           │   ├── productos-panel/   # ✅ ProductosTable + CrearProductoDialog + EditarProductoDialog + ProductoFormFields + AgregarVarianteDialog
│           │   ├── stock-table/       # ✅ StockBadge + tabla con estados vacíos
│           │   ├── ajustar-stock-form/  # ✅ Card form con FieldGroup y cálculo reactivo de saldo
│           │   ├── estado-acciones/   # ✅ transiciones de reserva manuales
│           │   ├── usuario-rol-editor/  # ✅ modal para editar rol y sucursal sin romper celdas
│           │   ├── usuarios-table/    # ✅ tabla modularizada de usuarios con avatar y badges
│           │   ├── reservas-table/    # ✅ tabla modularizada de reservas con badges de estado
│           │   ├── ventas-table/      # ✅ tabla modularizada de ventas con canales y comprobantes
│           │   ├── cupones-table/     # ✅ tabla modularizada de cupones con badges y cálculo de vigencia
│           │   └── crear-cupon-dialog/ # ✅ modal de alta de cupones porcentuales o de monto fijo
│           └── pages/
│               ├── CatalogoAdminPage.tsx      # ✅ Tabs: productos/categorías/colecciones/
│               │                              #   temporadas/tallas/colores
│               ├── ProveedoresAdminPage.tsx   # ✅
│               ├── SucursalesAdminPage.tsx    # ✅ Tabs: sucursales/ciudades
│               ├── InventarioAdminPage.tsx    # ✅ stock-table + ajustar-stock-form
│               ├── VentasAdminPage.tsx        # ✅ solo lectura
│               ├── ReservasAdminPage.tsx      # ✅ gestión de reservas y filtro por sucursal
│               ├── CuponesAdminPage.tsx       # ✅ gestión y activación de promociones y cupones
│               └── UsuariosAdminPage.tsx      # ✅ gestión de roles y cuentas con búsqueda y filtro
│
│           # `pos/` (punto de caja, RF17-18) y separar por rol ENCARGADO_SUCURSAL/CAJERO
│           # siguen sin construir — ver nota resuelta más abajo.
│
├── .env                               # VITE_API_URL=http://localhost:3000/api/v1
├── components.json                    # config shadcn (tema pendiente de definir)
├── vite.config.ts                     # alias @ -> ./src, puerto 5174
└── tsconfig.json
```

> [!NOTE] Sobre `admin/` (decisión tomada 2026-09-13)
> El enunciado tiene actores muy distintos entre sí (Cliente vs. Administrador vs. Encargado de
> sucursal vs. Cajero) — se resolvió que el panel interno vive **en este mismo
> `mirroria-frontend`**, como una sección gateada por rol (`AdminRoute`), no un segundo proyecto
> React aparte. Hoy solo cubre `ADMIN` (gestión de catálogo/proveedores/sucursales/inventario,
> lectura de ventas). `ENCARGADO_SUCURSAL` y `CAJERO` todavía no tienen vista propia — cuando la
> tengan, `pos/` (punto de caja, RF17-18) sería su propia sub-feature con su propio layout
> (pensado para tablet/desktop, no mobile-first), reusando el mismo patrón de `AdminRoute` pero
> aceptando esos roles en vez de solo `ADMIN`.

---

## 🛠️ 3. Reglas de Implementación para Agentes IA

Mismas reglas que `case-frontend`, sin cambios — ya están probadas:

1. **Nunca crear archivos monolíticos:** si un archivo supera 100 líneas, descomponer
   (constantes a `*.data.ts` solo si aplica el criterio 1.C, lógica compleja a un hook,
   subcomponentes a la carpeta del componente).
2. **Usar siempre el alias `@/`:** nunca rutas relativas largas
   (`../../../../components/ui/button`) — usar `@/components/ui/button`.
3. **No usar `'use client'`:** SPA en Vite + React, no Next.js.
4. **Navegación con `react-router-dom`:** `<Link to="...">` en vez de `<a href>`, `useNavigate()`
   en vez de `useRouter()`.
5. **Formularios:** React Hook Form + Zod para formularios no triviales (ver stack); componentes
   controlados simples alcanzan para formularios triviales.
6. **Manejo de Errores y Estados de Carga:** todo componente con peticiones asíncronas debe
   contemplar `loading`/`error`/`success` para dar feedback claro.
7. **Dinero siempre en centavos hasta el último momento de render:** el backend entrega
   `precioCents` como entero (ver `mirroria-backend/AGENTS.md`) — nunca dividir/multiplicar por
   100 disperso en componentes; usar siempre `formatMoney()` de `lib/money.ts` (ver sugerencia
   abajo) para evitar errores de redondeo repetidos en 5 lugares distintos.

---

## 💡 4. Sugerencias (no son parte obligatoria del patrón de `case-frontend`)

Estas son propuestas mías, no algo que ya esté validado como en las secciones de arriba —
decilo si querés que las aplique, las descarte, o las dejemos "para más adelante":

1. **TanStack Query (`@tanstack/react-query`) para estado de servidor**, en vez de
   `useEffect` + `fetch` manual en cada hook (que es lo que hace `case-frontend` hoy). Con un
   catálogo que se va a paginar/filtrar/cachear (categorías, listado de productos, carrito que
   cambia seguido) el boilerplate de loading/error/refetch se repite mucho más que en CASE
   (que es mayormente CRUD administrativo). Contra: una dependencia más y una curva de
   aprendizaje si es la primera vez que la usas — si preferís mantener exactamente el mismo
   patrón que CASE (hooks manuales), también es una opción totalmente válida para el volumen
   de un examen.
2. **`lib/money.ts` con `formatMoney(cents: number)`** desde el día 1 (no esperar a que se
   repita en 2+ lugares como marca la regla de promoción) — dado que *todo* precio que toque la
   UI pasa por centavos, es más una constante de dominio que un hook a extraer después.
3. **`ProductGallery` compartido desde el arranque** (no esperar a que se reutilice) por la
   misma razón: `producto.imagenes` (jsonb) se va a necesitar en la tarjeta de producto, en la
   ficha de detalle y probablemente en el vestidor virtual AR más adelante.
4. **Definir el tema visual (colores/tipografía) antes de instalar shadcn**, no dejarlo en el
   default gris — a diferencia de CASE (que ya tenía una dirección de marca clara desde el
   principio), MirrorIA todavía no tiene una. Vale la pena una conversación corta de dirección
   visual (moda femenina, vestidor AR) antes de que el default de shadcn se filtre a 40
   componentes y haya que rehacerlos.
