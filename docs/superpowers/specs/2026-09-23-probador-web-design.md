# Probador virtual en la web — diseño

**Fecha:** 23 de septiembre de 2026
**Estado:** aprobado en conversación, pendiente de plan de implementación

## Por qué

La portada de MirrorIA promete «Mírate con la prenda puesta, antes de decidir» y
el requisito de la materia pide **realidad aumentada**. Hoy, en la web, esa
promesa no existe: «Vestidor virtual» —en el menú y en el pie— apunta a un ancla
(`#vestidor`) que solo baja a una sección explicativa del inicio. El probador
está implementado **solo en la app móvil** (`mirroria-mobile/src/features/virtual-fitting/`),
que además no se puede compilar hoy por el límite de rutas de Windows.

Además, ninguno de los 28 productos del catálogo tiene con qué probarse: hay
**0 productos con `arOverlayImageUrl`** y **0 con `modeloArUrl`** en producción.
Aunque se abriera la app en un teléfono, el catálogo no aportaría ninguna prenda.

## Qué se construye

Un probador en el navegador: la cámara en vivo, espejada, con la prenda del
catálogo puesta sobre los hombros de quien mira, siguiéndola en tiempo real.

**Es realidad aumentada en sentido estricto** —elementos virtuales superpuestos
sobre la vista real, en vivo—, a diferencia de generar una imagen con IA, que es
síntesis y no cumpliría el requisito. La IA se usa igual, pero **fuera de línea y
una sola vez**, para fabricar los recortes de las prendas (ver «Los recortes»).

### Fuera de alcance

- Probador en 3D con modelos `.glb`: el móvil ya lo tiene; la web arranca en 2D.
- Generar imágenes con IA en vivo para cada visitante (costo por uso, 5-15 s de
  espera, y la foto de una persona saliendo hacia un tercero).
- Subida de recortes desde el panel admin: el backend no tiene subida de
  archivos. Se decide explícitamente no agregarla ahora.

## Lo que ya existe y se reusa

- **`computeGarmentTransform`** (`mirroria-mobile/.../lib/landmarkMath.ts`): a
  partir de los dos hombros devuelve posición, escala y rotación de la prenda.
  Es una función pura y **se porta a la web tal cual**. Usa los índices de
  landmark 11 y 12, que son los mismos en ML Kit (móvil) y en MediaPipe (web),
  porque ambos derivan de BlazePose.
- **`GarmentAnchor`** y **`STANDARD_GARMENT_ANCHOR`**: el móvil no mide el ancla
  por prenda, fija una **convención** —la línea de hombros cae al 65% del ancho,
  centrada, al 24% de la altura— y espera que el PNG la respete. La web adopta la
  misma convención y el script **normaliza cada recorte a ella**, así el mismo
  archivo sirve en las dos plataformas sin metadata extra.

### Las prendas de abajo no tienen hombros

Faldas, pantalones y enterizos (7 de los 28) no se anclan a la línea de hombros
sino a la de **caderas** (landmarks 23 y 24). `computeGarmentTransform` es
genérica —toma dos puntos, no «hombros»—, así que sirve igual; lo que cambia es
qué par se le pasa. **El par se decide por la categoría del producto**, no por
medir la imagen: vestidos, blusas y abrigos van por hombros; pantalones y faldas,
por caderas. Para esas prendas la convención del PNG se lee igual, con la línea
de cintura donde iría la de hombros.
- **`arOverlayImageUrl`** ya existe en la entidad, en los DTO, en el panel admin
  desplegado y en el móvil. No hace falta tocar el modelo de datos.
- **Reservas**: el probador engancha con el flujo que ya está, no lo reescribe.

## La pantalla

Dos rutas nuevas dentro de `StorefrontLayout`:

- **`/probador/:productoId`** — abre con esa prenda puesta. Es a donde lleva el
  botón «Probármelo» de la ficha, que aparece solo si el producto tiene recorte.
- **`/probador`** — sin prenda elegida: abre en el paso 3 del menú guiado, con
  la tira de prendas esperando. Es a donde pasan a apuntar «Vestidor virtual»
  del menú y del pie, que hoy no llevan a ningún lado.

Si el `:productoId` no existe o no tiene recorte, se comporta como `/probador`
—tira de prendas, sin prenda puesta— en vez de mostrar un error.

La pantalla tiene la cámara a lo alto, espejada como un espejo real, la prenda
encima, una tira horizontal abajo para cambiar de prenda sin salir, y dos
acciones: **sacar una foto** (se descarga en el dispositivo) y **reservar en
sucursal**.

### El menú guiado

Un panel de tres pasos, abierto la primera vez y reabrible desde un botón de
ayuda. Cada paso **se marca cuando el sistema lo verifica**, nunca porque la
clienta lo declare:

| Paso | Se marca cuando |
|---|---|
| 1. Permitir la cámara | llega el `MediaStream` |
| 2. Ubicarte bien | el detector ve **los dos hombros** por encima del umbral de visibilidad durante un segundo seguido |
| 3. Elegir la prenda | hay una prenda seleccionada |

Mientras el paso 2 no se cumple, el panel dice qué falta en palabras: «no te
veo», «acercate», «ponete de frente». Con los tres en verde el panel se reduce a
una barra fina. **Si después se pierde la pose, el paso 2 vuelve a encenderse
solo**, en vez de dejar la pantalla sin prenda y sin explicación.

## Cómo funciona por dentro

```
cámara (getUserMedia) ──► <video> espejado
                            │
                            ├─► PoseLandmarker (MediaPipe, wasm local)
                            │      └─► landmarks 11 y 12 (hombros)
                            │              └─► computeGarmentTransform(...)
                            │                     └─► {left, top, width, height, rotación}
                            └─────────────────────────────► <img> de la prenda
                                                             con transform CSS
```

- **Cámara:** `getUserMedia({ video: { facingMode: 'user' } })`. Requiere HTTPS,
  que el sitio ya tiene desde el despliegue con Let's Encrypt.
- **Pose:** `@mediapipe/tasks-vision`, con el `.wasm` y el modelo
  `pose_landmarker_lite.task` **alojados en `public/`**, no traídos de un CDN
  ajeno. Son ~8 MB que se descargan solo al entrar al probador; el resto del
  sitio no los paga.
- **Render:** la prenda es un `<img>` posicionado con `transform` de CSS,
  actualizado en `requestAnimationFrame`. No se usa canvas: así compone la GPU y
  no se re-renderiza React en cada cuadro.
- **Módulos nuevos** en `mirroria-frontend/src/features/fitting/`:
  `lib/landmarkMath.ts` (portado, puro), `lib/anclaPrenda.ts` (el ancla),
  `hooks/useCamara.ts`, `hooks/usePose.ts`, `components/` (escena, tira de
  prendas, panel guiado) y `pages/ProbadorPage.tsx`.

### Límite conocido

La prenda es **plana**: sigue el hombro, se inclina y escala, pero no se dobla
con el cuerpo ni tiene profundidad. Se ve correcta; no se ve como una foto
generada. Es el mismo límite que la Fase 3 del móvil documenta.

## Los recortes

Es la pieza de datos que hoy no existe y de la que depende todo lo demás.

**Cómo se fabrican** (script fuera de línea, en `scripts/`, igual en espíritu al
sembrador del catálogo): por cada producto se toma su foto de Burst, se la manda
a **kie.ai con `google/nano-banana-edit`** pidiendo la prenda sola sobre fondo
magenta, se le quita el fondo por croma con despill en los bordes, se recorta al
contenido y se **normaliza a la convención del móvil** (línea de anclaje al 65%
del ancho, al 24% de la altura) antes de guardar el PNG con alfa.

Probado el 23 de septiembre sobre `shiny-black-cocktail-dress`: el modelo
devuelve la prenda sola, completa y en vista frontal de catálogo; el recorte por
croma deja bordes limpios, **sin halo magenta**, y conserva hasta los breteles
finos. El modelo devuelve **JPEG**, no PNG, así que el fondo trae compresión: el
umbral con degradé (45-85 de distancia) y el despill son necesarios, no
opcionales.

**Verificación obligatoria:** antes de publicar, el script arma una hoja de
contacto con las 28 y **hay que mirarlas**. Los nombres de archivo y las
promesas del modelo no alcanzan; ya se aprendió en este proyecto que engañan.

**Dónde viven:** `mirroria-frontend/public/prendas/*.png`, que el Dockerfile ya
copia a nginx, servidas desde el mismo dominio. `arOverlayImageUrl` de cada
producto apunta ahí con URL absoluta (el móvil exige http(s), no rutas
relativas). Los PNG se redimensionan a 800 px de lado mayor y se cuantizan para
que las 28 no inflen la imagen del contenedor.

**Costo, medido:** 4 créditos por imagen. Quedan **94 créditos** en la cuenta de
kie.ai → alcanzan para **23 de las 28**, y los reintentos de las que salgan mal
también cuestan.

**Decisión tomada para no bloquear la implementación:** se empieza por las 23 que
entran, priorizando vestidos y abrigos, que son las prendas donde el probador se
luce. Los productos sin recorte no muestran el botón «Probármelo» y el sitio
funciona igual. Si el usuario recarga créditos, el mismo script completa las que
faltan sin rehacer las ya hechas.

## Cuando algo falla

| Situación | Qué se ve |
|---|---|
| Permiso denegado | la prenda sobre una silueta de referencia, el motivo escrito y cómo rehabilitarla desde el candado del navegador |
| Sin cámara en el equipo | lo mismo, con el motivo correspondiente |
| Navegador sin soporte (wasm/getUserMedia) | lo mismo, invitando a abrirlo desde el celular |
| Pose no detectada | la prenda se oculta y el paso 2 del menú se reenciende con el aviso concreto |
| Producto sin recorte | el botón «Probármelo» no aparece en la ficha |

En **todos** los casos el botón de reservar en sucursal sigue disponible: el
probador nunca es un callejón sin salida.

## Cómo se prueba

- **Unitario (vitest, ya instalado):** la matemática portada
  (`computeGarmentTransform`), el cálculo del ancla desde el PNG, la máquina de
  los tres pasos del menú guiado y la elección de prenda. Todo lógica pura.
- **Navegador real (Playwright):** Chromium acepta una cámara falsa alimentada
  con un archivo (`--use-fake-device-for-media-stream`,
  `--use-file-for-fake-video-capture`), así que el recorrido completo se puede
  automatizar sin webcam.
  **Riesgo declarado:** todavía no se verificó que el detector reconozca la pose
  en ese video falso. Si no lo hace, la prueba automática cubrirá permisos,
  estados de error y el menú guiado, y «la prenda sigue al cuerpo» quedará para
  una revisión con los ojos, anotada como tal.
- **A ojo:** una pasada con una persona real frente a la cámara antes de dar la
  funcionalidad por terminada.

## Riesgos

1. **Calidad despareja de los recortes.** Se mitiga mirándolos todos y
   rehaciendo los malos; cuesta créditos.
2. **Créditos insuficientes** para las 28 (ver arriba).
3. **El detector de pose en equipos lentos.** El modelo `lite` está elegido a
   propósito; si aun así va lento, se baja la frecuencia de detección y se
   interpola entre cuadros.
4. **Nada de esto se ve en producción hasta que se redespliegue el frontend**,
   que hoy se compila desde `main`.
