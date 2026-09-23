# Probador virtual en la web — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que una clienta abra `/probador` en la web, se vea en la cámara con una prenda del catálogo puesta sobre el cuerpo y siguiéndola en tiempo real, guiada por un menú de tres pasos.

**Architecture:** la cámara va a un `<video>` espejado; MediaPipe Pose (wasm alojado en el propio servidor) devuelve 33 landmarks por cuadro; se toman dos puntos —hombros o caderas, según la categoría— y `computeGarmentTransform`, portada tal cual del móvil, devuelve posición, escala y rotación para un `<img>` movido con `transform` de CSS. Las prendas son PNG con alfa generados fuera de línea y normalizados a la convención de anclaje que ya usa el móvil.

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind v4 (frontend existente), `@mediapipe/tasks-vision`, vitest (ya instalado), Python 3.13 con Pillow/numpy para el pipeline de recortes, kie.ai (`google/nano-banana-edit`) para aislar la prenda.

**Spec:** `docs/superpowers/specs/2026-09-23-probador-web-design.md`

## Global Constraints

- **Rama:** `probador-web`. No tocar `main` ni `mirroria-mobile/`.
- **Idioma:** nombres de símbolos, comentarios y textos de interfaz en castellano rioplatense («probátela», «elegí»), igual que el resto del frontend.
- **Runner de pruebas:** `npm test` en `mirroria-frontend/` (vitest, ya configurado). El frontend **no tiene entorno de DOM**: importar componentes o `App.tsx` en una prueba **cuelga el proceso** (medido: 55 s hasta el timeout). Solo se prueban por unidad funciones puras.
- **Sin CDN externos:** el `.wasm` y el modelo de MediaPipe se sirven desde `public/`. El sitio ya tiene HTTPS, requisito de `getUserMedia`.
- **Convención de anclaje (compartida con el móvil):** en todo PNG de prenda, la línea de anclaje cae al **65 % del ancho**, centrada, al **24 % de la altura** (`STANDARD_GARMENT_ANCHOR` en `mirroria-mobile/src/features/virtual-fitting/lib/garmentAnchor.ts`).
- **Índices de landmark:** hombros 11 y 12; caderas 23 y 24. Umbral de visibilidad `0.5`.
- **URLs absolutas** en `arOverlayImageUrl` (`https://mirroria.duckdns.org/prendas/<slug>.png`): el móvil no acepta rutas relativas.
- **Presupuesto:** 4 créditos de kie.ai por imagen, quedan 94 → 23 prendas. Priorizar vestidos y abrigos.
- **Clases de Tailwind escritas enteras**, nunca armadas con plantillas: Tailwind lee el código fuente para generar el CSS.
- **Credenciales por variable de entorno**, nunca en un archivo commiteado.

## Review Focus

1. **`/probador/:productoId` con un id que no existe o sin recorte** — debe comportarse como `/probador` (tira de prendas, sin prenda puesta), no mostrar un error ni una pantalla vacía. → Tarea 7.
2. **Un solo hombro visible o visibilidad por debajo de 0,5** — la prenda se oculta entera; nunca queda anclada a un punto solo ni salta al borde. → Tarea 1.
3. **El PNG de la prenda no carga (404 o red caída)** — la escena sigue viva y el paso 3 avisa; no se rompe el bucle de render. → implementado en Tarea 7 (`onErrorPrenda`). **Sin prueba unitaria posible**: es comportamiento del DOM y este frontend no tiene entorno de DOM; se comprueba en la Tarea 9 borrando un PNG a propósito.
4. **Permiso de cámara revocado a mitad de sesión** (o la pestaña pierde el stream) — vuelve al paso 1 con el motivo, sin quedar con un `<video>` congelado. → implementado en Tarea 6 (`track.onended`). **Sin prueba unitaria posible** por lo mismo; se comprueba a mano en la Tarea 9, revocando el permiso con el probador abierto.
5. **Prenda de abajo (falda, pantalón, enterizo)** — se ancla a caderas, no a hombros; si se anclara a hombros quedaría a la altura del pecho. → Tarea 2.

---

### Task 1: Portar la matemática del anclaje

**Files:**
- Create: `mirroria-frontend/src/features/fitting/lib/landmarkMath.ts`
- Test: `mirroria-frontend/src/features/fitting/lib/landmarkMath.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `interface PuntoPose { x: number; y: number; visibility: number }`, `interface AnclaPrenda { shoulderWidthFraction: number; anchorX: number; anchorY: number }`, `interface TransformPrenda { visible: boolean; left: number; top: number; width: number; height: number; rotationDeg: number }`, `const ANCLA_ESTANDAR: AnclaPrenda`, `const VISIBILIDAD_MINIMA = 0.5`, y `function calcularTransformPrenda(izq, der, anchoContenedor, altoContenedor, espejado, anchoImagen, altoImagen, ancla): TransformPrenda`.

- [ ] **Step 1: Escribir las pruebas que fallan**

Crear `mirroria-frontend/src/features/fitting/lib/landmarkMath.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { ANCLA_ESTANDAR, calcularTransformPrenda, VISIBILIDAD_MINIMA } from "./landmarkMath"

const visible = (x: number, y: number) => ({ x, y, visibility: 0.9 })

describe("calcularTransformPrenda", () => {
  it("con los hombros nivelados y espejado, la prenda no se inclina", () => {
    const t = calcularTransformPrenda(
      visible(0.6, 0.4), visible(0.4, 0.4), 1000, 800, true, 400, 600, ANCLA_ESTANDAR
    )
    expect(t.visible).toBe(true)
    expect(Math.abs(t.rotationDeg)).toBeLessThan(0.001)
  })

  it("el ancho de la prenda sale del ancho entre los dos puntos", () => {
    // 0,2 del ancho del contenedor = 200 px entre puntos; la convención dice
    // que esos 200 px son el 65 % del ancho de la imagen.
    const t = calcularTransformPrenda(
      visible(0.6, 0.5), visible(0.4, 0.5), 1000, 800, true, 400, 600, ANCLA_ESTANDAR
    )
    expect(t.width).toBeCloseTo(200 / 0.65, 5)
    expect(t.height).toBeCloseTo((200 / 0.65) * (600 / 400), 5)
  })

  it("el punto medio entre los dos puntos queda donde dice el ancla", () => {
    const t = calcularTransformPrenda(
      visible(0.6, 0.5), visible(0.4, 0.5), 1000, 800, true, 400, 600, ANCLA_ESTANDAR
    )
    expect(t.left + ANCLA_ESTANDAR.anchorX * t.width).toBeCloseTo(500, 5)
    expect(t.top + ANCLA_ESTANDAR.anchorY * t.height).toBeCloseTo(400, 5)
  })

  it("si falta uno de los dos puntos, la prenda se oculta", () => {
    const t = calcularTransformPrenda(
      visible(0.6, 0.4), undefined, 1000, 800, true, 400, 600, ANCLA_ESTANDAR
    )
    expect(t.visible).toBe(false)
  })

  it("si un punto está por debajo del umbral de visibilidad, la prenda se oculta", () => {
    // Review Focus 2: con un hombro tapado no se ancla a uno solo ni salta.
    const flojo = { x: 0.4, y: 0.4, visibility: VISIBILIDAD_MINIMA - 0.01 }
    const t = calcularTransformPrenda(
      visible(0.6, 0.4), flojo, 1000, 800, true, 400, 600, ANCLA_ESTANDAR
    )
    expect(t.visible).toBe(false)
  })

  it("sin espejar, unos hombros nivelados tampoco se inclinan", () => {
    const t = calcularTransformPrenda(
      visible(0.4, 0.4), visible(0.6, 0.4), 1000, 800, false, 400, 600, ANCLA_ESTANDAR
    )
    expect(Math.abs(t.rotationDeg)).toBeLessThan(0.001)
  })
})
```

- [ ] **Step 2: Correr y verla fallar**

```
cd mirroria-frontend && npx vitest run src/features/fitting/lib/landmarkMath.test.ts
```
Esperado: FAIL con «Cannot find module './landmarkMath'».

- [ ] **Step 3: Escribir el módulo**

Crear `mirroria-frontend/src/features/fitting/lib/landmarkMath.ts`. Es el port de `mirroria-mobile/src/features/virtual-fitting/lib/landmarkMath.ts` (función `computeGarmentTransform`), con los nombres en castellano y **sin** la directiva `'worklet'`, que es de Reanimated y en la web no significa nada:

```ts
/** Un punto de pose normalizado 0-1, como los devuelve MediaPipe. */
export interface PuntoPose {
  x: number
  y: number
  visibility: number
}

/** Dónde cae, dentro del PNG de la prenda, la línea de anclaje: qué fracción
 * de su ancho equivale a la distancia real entre los dos puntos del cuerpo, y
 * en qué punto de la imagen (0-1) cae el medio de esa línea. */
export interface AnclaPrenda {
  shoulderWidthFraction: number
  anchorX: number
  anchorY: number
}

export interface TransformPrenda {
  visible: boolean
  left: number
  top: number
  width: number
  height: number
  rotationDeg: number
}

/** La misma convención que respeta el móvil (`STANDARD_GARMENT_ANCHOR`): la
 * línea de anclaje cae al 65 % del ancho, centrada, al 24 % de la altura. Los
 * recortes se generan normalizados a esto, así el mismo PNG sirve en las dos
 * plataformas. */
export const ANCLA_ESTANDAR: AnclaPrenda = {
  shoulderWidthFraction: 0.65,
  anchorX: 0.5,
  anchorY: 0.24,
}

/** Por debajo de esto el detector no está seguro de que el punto se vea
 * (tapado, fuera de cuadro): se oculta la prenda en vez de anclarla mal. */
export const VISIBILIDAD_MINIMA = 0.5

const OCULTA: TransformPrenda = {
  visible: false,
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  rotationDeg: 0,
}

/**
 * Distancia entre los dos puntos → escala; punto medio → posición; ángulo de
 * la línea que los une → rotación.
 *
 * Portada de `computeGarmentTransform` del móvil. Es genérica a propósito:
 * recibe dos puntos, no «hombros». Para una falda o un pantalón se le pasan
 * las caderas y funciona igual (ver `parDeAnclaje.ts`).
 */
export function calcularTransformPrenda(
  izquierdo: PuntoPose | undefined,
  derecho: PuntoPose | undefined,
  anchoContenedor: number,
  altoContenedor: number,
  espejado: boolean,
  anchoImagen: number,
  altoImagen: number,
  ancla: AnclaPrenda,
): TransformPrenda {
  if (!izquierdo || !derecho) return OCULTA
  if (izquierdo.visibility < VISIBILIDAD_MINIMA || derecho.visibility < VISIBILIDAD_MINIMA) {
    return OCULTA
  }

  // El cuadro crudo no está espejado, pero el preview de la cámara frontal sí:
  // se espeja acá para que la prenda caiga donde la clienta se ve.
  const izqX = (espejado ? 1 - izquierdo.x : izquierdo.x) * anchoContenedor
  const derX = (espejado ? 1 - derecho.x : derecho.x) * anchoContenedor
  const izqY = izquierdo.y * altoContenedor
  const derY = derecho.y * altoContenedor

  const anchoEntrePuntos = Math.hypot(derX - izqX, derY - izqY)
  const medioX = (izqX + derX) / 2
  const medioY = (izqY + derY) / 2

  const escala = anchoEntrePuntos / (anchoImagen * ancla.shoulderWidthFraction)
  const width = anchoImagen * escala
  const height = altoImagen * escala

  // El -180° al espejar: al invertir x también se invierte el orden
  // izquierda/derecha en pantalla, y sin esa corrección "nivelado" daría 180°.
  // Sin espejar NO va (en el móvil se confirmó en vivo que deja la prenda casi
  // al revés).
  const rotacionRad = Math.atan2(izqY - derY, izqX - derX) - (espejado ? Math.PI : 0)

  return {
    visible: true,
    left: medioX - ancla.anchorX * width,
    top: medioY - ancla.anchorY * height,
    width,
    height,
    rotationDeg: (rotacionRad * 180) / Math.PI,
  }
}
```

- [ ] **Step 4: Correr y verla pasar**

```
cd mirroria-frontend && npx vitest run src/features/fitting/lib/landmarkMath.test.ts
```
Esperado: PASS, 6 pruebas. Después correr **toda** la suite: `npm test` (debe quedar en 8 anteriores + 6 = 14).

- [ ] **Step 5: Commit**

```bash
git add mirroria-frontend/src/features/fitting/lib/
git commit -m "feat(probador): portar la matematica del anclaje del movil a la web"
```

---

### Task 2: Elegir el par de puntos según la categoría

**Files:**
- Create: `mirroria-frontend/src/features/fitting/lib/parDeAnclaje.ts`
- Test: `mirroria-frontend/src/features/fitting/lib/parDeAnclaje.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `const INDICE_POSE = { HOMBRO_IZQ: 11, HOMBRO_DER: 12, CADERA_IZQ: 23, CADERA_DER: 24 }` y `function parDeAnclaje(slugCategoria: string): [number, number]`.

- [ ] **Step 1: Escribir las pruebas que fallan**

Crear `mirroria-frontend/src/features/fitting/lib/parDeAnclaje.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { INDICE_POSE, parDeAnclaje } from "./parDeAnclaje"

describe("parDeAnclaje", () => {
  it("un vestido se ancla a los hombros", () => {
    expect(parDeAnclaje("vestidos")).toEqual([INDICE_POSE.HOMBRO_IZQ, INDICE_POSE.HOMBRO_DER])
  })

  it("una blusa se ancla a los hombros", () => {
    expect(parDeAnclaje("blusas-y-tops")).toEqual([INDICE_POSE.HOMBRO_IZQ, INDICE_POSE.HOMBRO_DER])
  })

  it("un abrigo se ancla a los hombros", () => {
    expect(parDeAnclaje("abrigos-y-blazers")).toEqual([INDICE_POSE.HOMBRO_IZQ, INDICE_POSE.HOMBRO_DER])
  })

  it("una falda o un pantalón se anclan a las CADERAS", () => {
    // Review Focus 5: anclarlos a hombros los dejaría a la altura del pecho.
    expect(parDeAnclaje("pantalones-y-faldas")).toEqual([INDICE_POSE.CADERA_IZQ, INDICE_POSE.CADERA_DER])
  })

  it("una categoría desconocida cae en hombros, que es lo más común", () => {
    expect(parDeAnclaje("categoria-que-no-existe")).toEqual([
      INDICE_POSE.HOMBRO_IZQ,
      INDICE_POSE.HOMBRO_DER,
    ])
  })
})
```

- [ ] **Step 2: Correr y verla fallar**

```
cd mirroria-frontend && npx vitest run src/features/fitting/lib/parDeAnclaje.test.ts
```
Esperado: FAIL con «Cannot find module './parDeAnclaje'».

- [ ] **Step 3: Escribir el módulo**

```ts
/** Índices fijos del esquema MediaPipe/BlazePose (0-32). Son los mismos que
 * usa ML Kit en el móvil, porque ambos derivan del mismo modelo. */
export const INDICE_POSE = {
  HOMBRO_IZQ: 11,
  HOMBRO_DER: 12,
  CADERA_IZQ: 23,
  CADERA_DER: 24,
} as const

const POR_CADERAS = new Set(["pantalones-y-faldas"])

/**
 * Qué dos puntos del cuerpo usa cada prenda para anclarse.
 *
 * Una falda no tiene hombros: si se anclara a ellos quedaría colgando del
 * pecho. Se decide por la categoría del producto y no midiendo la imagen,
 * porque la categoría ya dice inequívocamente si la prenda va arriba o abajo.
 */
export function parDeAnclaje(slugCategoria: string): [number, number] {
  return POR_CADERAS.has(slugCategoria)
    ? [INDICE_POSE.CADERA_IZQ, INDICE_POSE.CADERA_DER]
    : [INDICE_POSE.HOMBRO_IZQ, INDICE_POSE.HOMBRO_DER]
}
```

- [ ] **Step 4: Correr y verla pasar**

```
cd mirroria-frontend && npx vitest run src/features/fitting/lib/parDeAnclaje.test.ts
```
Esperado: PASS, 5 pruebas. Luego `npm test` completo (19).

- [ ] **Step 5: Commit**

```bash
git add mirroria-frontend/src/features/fitting/lib/parDeAnclaje.ts mirroria-frontend/src/features/fitting/lib/parDeAnclaje.test.ts
git commit -m "feat(probador): las prendas de abajo se anclan a las caderas"
```

---

### Task 3: Recorte por croma y normalización a la convención

**Files:**
- Create: `scripts/prendas/recorte.py`
- Test: `scripts/prendas/test_recorte.py`

**Interfaces:**
- Consumes: nada.
- Produces: `quitar_croma(imagen_rgb: PIL.Image, suave=(45, 85)) -> PIL.Image` (devuelve RGBA con alfa y despill), `linea_de_anclaje(imagen_rgba) -> tuple[float, float]` (x del centro y ancho de la línea, en píxeles) y `normalizar(imagen_rgba, lado_mayor=800) -> PIL.Image` (deja la línea de anclaje al 65 % del ancho y al 24 % de la altura).

Se hace en Python y no en Node porque Pillow y numpy ya están instalados, el algoritmo de croma ya se probó ahí, y el repo ya tiene precedente de scripts Python (`mirroria-mobile/scripts/verificar-glb.py`).

- [ ] **Step 1: Escribir las pruebas que fallan**

Crear `scripts/prendas/test_recorte.py`. Usa `unittest`, que viene con Python — sin dependencias nuevas:

```python
# -*- coding: utf-8 -*-
"""Pruebas del recorte, con imagenes sinteticas: nada de red ni de IA."""
import unittest

from PIL import Image

from recorte import linea_de_anclaje, normalizar, quitar_croma

MAGENTA = (198, 51, 131)


def prenda_de_prueba(ancho=400, alto=600, hombros_y=100, hombros_ancho=200):
    """Una 'prenda' sobre fondo croma: un trapecio azul con hombros anchos."""
    im = Image.new("RGB", (ancho, alto), MAGENTA)
    px = im.load()
    for y in range(hombros_y, alto - 50):
        mitad = hombros_ancho // 2 if y < hombros_y + 20 else hombros_ancho // 2 - 30
        for x in range(ancho // 2 - mitad, ancho // 2 + mitad):
            px[x, y] = (20, 40, 200)
    return im


class QuitarCroma(unittest.TestCase):
    def test_el_fondo_queda_transparente(self):
        rgba = quitar_croma(prenda_de_prueba())
        self.assertEqual(rgba.mode, "RGBA")
        self.assertEqual(rgba.getpixel((0, 0))[3], 0)

    def test_la_prenda_queda_opaca(self):
        rgba = quitar_croma(prenda_de_prueba())
        self.assertEqual(rgba.getpixel((200, 300))[3], 255)

    def test_no_deja_tinte_magenta_en_la_prenda(self):
        r, g, b, _ = quitar_croma(prenda_de_prueba()).getpixel((200, 300))
        self.assertLess(r, 80)
        self.assertLess(b, 255)


class LineaDeAnclaje(unittest.TestCase):
    def test_encuentra_el_ancho_de_los_hombros(self):
        rgba = quitar_croma(prenda_de_prueba(hombros_ancho=200))
        centro_x, ancho = linea_de_anclaje(rgba)
        self.assertAlmostEqual(centro_x, 200, delta=6)
        self.assertAlmostEqual(ancho, 200, delta=12)


class Normalizar(unittest.TestCase):
    def test_deja_la_linea_donde_manda_la_convencion(self):
        salida = normalizar(quitar_croma(prenda_de_prueba()))
        centro_x, ancho = linea_de_anclaje(salida)
        self.assertAlmostEqual(ancho / salida.width, 0.65, delta=0.03)
        self.assertAlmostEqual(centro_x / salida.width, 0.50, delta=0.03)

    def test_no_pasa_del_lado_mayor_pedido(self):
        salida = normalizar(quitar_croma(prenda_de_prueba()), lado_mayor=800)
        self.assertLessEqual(max(salida.size), 800)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Correr y verla fallar**

```
cd scripts/prendas && python test_recorte.py
```
Esperado: FAIL con «ModuleNotFoundError: No module named 'recorte'».
Usar el Python que tiene Pillow y numpy: `C:/Users/gener/AppData/Local/Programs/Python/Python313/python.exe` (el `python` del PATH es el de msys2 y no los trae).

- [ ] **Step 3: Escribir el módulo**

Crear `scripts/prendas/recorte.py`:

```python
# -*- coding: utf-8 -*-
"""Convierte la salida del modelo (prenda sobre fondo croma) en un PNG con
alfa, normalizado a la convencion de anclaje que ya usa el movil.

El modelo devuelve JPEG, no PNG: el fondo viene con compresion, asi que el
umbral tiene degrade y hace falta despill en el borde. No son adornos.
"""
import numpy as np
from PIL import Image

# La linea de anclaje cae al 65% del ancho y al 24% de la altura
# (STANDARD_GARMENT_ANCHOR del movil).
FRACCION_ANCHO = 0.65
FRACCION_ALTO = 0.24


def quitar_croma(imagen_rgb, suave=(45, 85)):
    """Fondo croma -> alfa. El color de fondo se deduce del borde."""
    a = np.asarray(imagen_rgb.convert("RGB")).astype(float)
    h, w, _ = a.shape
    borde = np.concatenate([a[0, :, :], a[h - 1, :, :], a[:, 0, :], a[:, w - 1, :]])
    fondo = np.median(borde, axis=0)

    d = np.sqrt(((a - fondo) ** 2).sum(axis=2))
    lo, hi = suave
    alfa = np.clip((d - lo) / (hi - lo), 0, 1)

    # Despill: al borde le queda tinte del croma. Se bajan los canales
    # dominantes del fondo hacia el canal que el croma casi no usa.
    rgb = a.copy()
    canal_limpio = int(np.argmin(fondo))
    referencia = rgb[:, :, canal_limpio]
    en_borde = (alfa > 0) & (alfa < 1)
    for canal in range(3):
        if canal == canal_limpio:
            continue
        exceso = rgb[:, :, canal] - referencia
        rgb[:, :, canal] = np.where(en_borde & (exceso > 0), referencia + exceso * 0.3, rgb[:, :, canal])

    return Image.fromarray(np.dstack([rgb, alfa * 255]).astype(np.uint8), "RGBA")


def linea_de_anclaje(imagen_rgba):
    """Centro y ancho (px) de la linea mas ancha del tercio superior opaco.

    En una prenda de arriba eso es la linea de hombros; en una falda o un
    pantalon, la cintura, que es justo donde hay que colgarla.
    """
    alfa = np.asarray(imagen_rgba.split()[-1]).astype(float) / 255
    filas_con_prenda = np.where(alfa.max(axis=1) > 0.5)[0]
    if len(filas_con_prenda) == 0:
        raise ValueError("la imagen quedo vacia: no hay prenda que medir")

    arriba = filas_con_prenda[0]
    abajo = filas_con_prenda[-1]
    hasta = arriba + max(1, int((abajo - arriba) * 0.33))

    mejor_ancho, mejor_centro = 0.0, imagen_rgba.width / 2
    for y in range(arriba, hasta):
        columnas = np.where(alfa[y] > 0.5)[0]
        if len(columnas) < 2:
            continue
        ancho = float(columnas[-1] - columnas[0])
        if ancho > mejor_ancho:
            mejor_ancho = ancho
            mejor_centro = float(columnas[0] + columnas[-1]) / 2
    return mejor_centro, mejor_ancho


def normalizar(imagen_rgba, lado_mayor=800):
    """Recorta al contenido y encuadra para que la linea de anclaje caiga
    donde manda la convencion, rellenando con transparencia."""
    imagen_rgba = imagen_rgba.crop(imagen_rgba.getbbox())
    centro_x, ancho_linea = linea_de_anclaje(imagen_rgba)
    if ancho_linea <= 0:
        raise ValueError("no se pudo medir la linea de anclaje")

    # El lienzo se dimensiona para que `ancho_linea` sea el 65% de su ancho.
    ancho_lienzo = int(round(ancho_linea / FRACCION_ANCHO))
    # La linea esta a `y_linea` del recorte; debe quedar al 24% del alto.
    alfa = np.asarray(imagen_rgba.split()[-1]).astype(float) / 255
    filas = np.where(alfa.max(axis=1) > 0.5)[0]
    y_linea = 0.0
    mejor = 0.0
    hasta = filas[0] + max(1, int((filas[-1] - filas[0]) * 0.33))
    for y in range(filas[0], hasta):
        cols = np.where(alfa[y] > 0.5)[0]
        if len(cols) >= 2 and float(cols[-1] - cols[0]) > mejor:
            mejor = float(cols[-1] - cols[0])
            y_linea = float(y)

    alto_lienzo = max(int(round(y_linea / FRACCION_ALTO)),
                      int(round(imagen_rgba.height + y_linea * (1 / FRACCION_ALTO - 1))))
    lienzo = Image.new("RGBA", (ancho_lienzo, alto_lienzo), (0, 0, 0, 0))
    destino_x = int(round(ancho_lienzo * 0.5 - centro_x))
    destino_y = int(round(alto_lienzo * FRACCION_ALTO - y_linea))
    lienzo.alpha_composite(imagen_rgba, (max(destino_x, 0), max(destino_y, 0)))

    if max(lienzo.size) > lado_mayor:
        escala = lado_mayor / max(lienzo.size)
        lienzo = lienzo.resize(
            (max(1, int(lienzo.width * escala)), max(1, int(lienzo.height * escala))),
            Image.LANCZOS,
        )
    return lienzo
```

- [ ] **Step 4: Correr y verla pasar**

```
cd scripts/prendas && C:/Users/gener/AppData/Local/Programs/Python/Python313/python.exe test_recorte.py -v
```
Esperado: PASS, 6 pruebas. Si `normalizar` deja la línea fuera de tolerancia, ajustar el cálculo del lienzo — **no** la tolerancia de la prueba.

- [ ] **Step 5: Commit**

```bash
git add scripts/prendas/recorte.py scripts/prendas/test_recorte.py
git commit -m "feat(prendas): recorte por croma y normalizacion a la convencion de anclaje"
```

---

### Task 4: Generar los recortes de las prendas y mirarlos

**Files:**
- Create: `scripts/prendas/generar-recortes.py`
- Create (salida, commiteada): `mirroria-frontend/public/prendas/<slug>.png`
- Create (salida, descartable): `scripts/prendas/.trabajo/` (agregar al `.gitignore` del repo)

**Interfaces:**
- Consumes: `recorte.quitar_croma`, `recorte.normalizar` (Tarea 3).
- Produces: los PNG y una hoja de contacto `scripts/prendas/.trabajo/hoja-contacto.png`.

- [ ] **Step 1: Escribir el generador**

Crear `scripts/prendas/generar-recortes.py`. Toma los productos del API, prioriza vestidos y abrigos, y **saltea los que ya tienen PNG** (así una segunda corrida completa lo que falte sin gastar créditos de nuevo):

```python
# -*- coding: utf-8 -*-
"""Genera los recortes de prenda a partir de las fotos del catalogo.

  KIE_API_KEY=... python generar-recortes.py [--limite 23] [--api URL]

Cuesta 4 creditos por imagen. Saltea las que ya existen.
"""
import argparse, json, os, sys, time, urllib.request
from io import BytesIO

from PIL import Image
from recorte import normalizar, quitar_croma

API = "https://mirroria.duckdns.org/api/v1"
SALIDA = os.path.join(os.path.dirname(__file__), "..", "..", "mirroria-frontend", "public", "prendas")
TRABAJO = os.path.join(os.path.dirname(__file__), ".trabajo")
CLAVE = os.environ.get("KIE_API_KEY")

PROMPT = (
    "Extract ONLY the garment worn by the person. Remove the person, the "
    "background and every other object completely. Return the garment alone, "
    "flat front view like an e-commerce catalog cutout, centered and complete, "
    "keeping its real colors, fabric texture and pattern. Place it on a solid "
    "pure magenta (#FF00FF) background."
)
# Las prendas donde el probador se luce van primero: el presupuesto no alcanza
# para las 28 (4 creditos cada una, quedan 94).
PRIORIDAD = ["vestidos", "abrigos-y-blazers", "blusas-y-tops", "pantalones-y-faldas"]


def pedir(url, datos=None, cabeceras=None, espera=120):
    req = urllib.request.Request(url, data=datos, headers=cabeceras or {},
                                 method="POST" if datos else "GET")
    with urllib.request.urlopen(req, timeout=espera) as r:
        return r.read()


def aislar_prenda(url_foto):
    """Manda la foto al modelo y devuelve la imagen con la prenda sobre croma."""
    cuerpo = json.dumps({
        "model": "google/nano-banana-edit",
        "input": {"prompt": PROMPT, "image_urls": [url_foto],
                  "output_format": "png", "image_size": "auto"},
    }).encode()
    r = json.loads(pedir("https://api.kie.ai/api/v1/jobs/createTask", cuerpo,
                         {"Authorization": f"Bearer {CLAVE}", "Content-Type": "application/json"}))
    tarea = r["data"]["taskId"]
    for _ in range(40):
        d = json.loads(pedir(f"https://api.kie.ai/api/v1/jobs/recordInfo?taskId={tarea}",
                             None, {"Authorization": f"Bearer {CLAVE}"}))
        estado = d.get("data", {}).get("state")
        if estado == "success":
            url = json.loads(d["data"]["resultJson"])["resultUrls"][0]
            return Image.open(BytesIO(pedir(url, None, {"User-Agent": "Mozilla/5.0"})))
        if estado == "fail":
            raise RuntimeError(json.dumps(d)[:300])
        time.sleep(6)
    raise TimeoutError("el modelo no contesto a tiempo")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limite", type=int, default=23)
    ap.add_argument("--api", default=API)
    args = ap.parse_args()
    if not CLAVE:
        sys.exit("falta KIE_API_KEY en el entorno")

    os.makedirs(SALIDA, exist_ok=True)
    os.makedirs(TRABAJO, exist_ok=True)

    productos = json.loads(pedir(f"{args.api}/catalogo/productos"))
    categorias = {c["id"]: c["slug"] for c in json.loads(pedir(f"{args.api}/catalogo/categorias"))}
    productos.sort(key=lambda p: PRIORIDAD.index(categorias.get(p["categoriaId"], ""))
                   if categorias.get(p["categoriaId"], "") in PRIORIDAD else 99)

    hechos = 0
    for p in productos:
        destino = os.path.join(SALIDA, f"{p['slug']}.png")
        if os.path.exists(destino):
            print(f"  = {p['slug']} (ya estaba)")
            continue
        if hechos >= args.limite:
            print(f"  . {p['slug']} (fuera del limite de {args.limite})")
            continue
        foto = (p.get("imagenes") or [{}])[0].get("url")
        if not foto:
            print(f"  ! {p['slug']} sin foto")
            continue
        try:
            croma = aislar_prenda(foto)
            croma.save(os.path.join(TRABAJO, f"{p['slug']}-croma.png"))
            normalizar(quitar_croma(croma)).save(destino)
            hechos += 1
            print(f"  + {p['slug']}")
        except Exception as e:
            print(f"  ! {p['slug']}: {str(e)[:120]}")

    # Hoja de contacto para MIRAR el resultado, sobre un fondo a cuadros que
    # deja ver los bordes y cualquier resto de fondo.
    archivos = sorted(f for f in os.listdir(SALIDA) if f.endswith(".png"))
    if archivos:
        celda, cols = 260, 6
        filas = (len(archivos) + cols - 1) // cols
        hoja = Image.new("RGB", (cols * celda, filas * celda), "white")
        for i in range(0, cols * celda, 20):
            for j in range(0, filas * celda, 20):
                if (i // 20 + j // 20) % 2 == 0:
                    hoja.paste((225, 225, 225), (i, j, min(i + 20, hoja.width), min(j + 20, hoja.height)))
        for n, nombre in enumerate(archivos):
            im = Image.open(os.path.join(SALIDA, nombre)).convert("RGBA")
            im.thumbnail((celda - 10, celda - 10))
            hoja.paste(im, ((n % cols) * celda + 5, (n // cols) * celda + 5), im)
        hoja.save(os.path.join(TRABAJO, "hoja-contacto.png"))
        print(f"\nhoja de contacto: {os.path.join(TRABAJO, 'hoja-contacto.png')} ({len(archivos)} prendas)")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Correr con UNA sola prenda y mirarla**

```
cd scripts/prendas
KIE_API_KEY=... C:/Users/gener/.../python.exe generar-recortes.py --limite 1
```
Abrir el PNG generado y la hoja de contacto. Criterio para aceptar: la prenda está completa, sin pedazos del cuerpo, sin halo de color en el borde, y de frente. Si falla, ajustar el prompt y reintentar **antes** de gastar los 22 restantes.

- [ ] **Step 3: Generar el resto**

```
KIE_API_KEY=... C:/Users/gener/.../python.exe generar-recortes.py --limite 23
```

- [ ] **Step 4: Mirar la hoja de contacto entera**

Abrir `scripts/prendas/.trabajo/hoja-contacto.png`. Borrar el PNG de cada prenda que haya salido mal y volver a correr el script: regenera solo las que faltan. Anotar cuáles quedaron afuera.

- [ ] **Step 5: Apuntar cada producto a su recorte**

Sin esto **el probador no muestra nada**: `arOverlayImageUrl` está en `null` en los
28 productos y `prendasProbables` (Tarea 7) los filtra a todos.

Agregar al sembrador (`scripts/sembrar-catalogo.mjs`), dentro del bloque que ya
recorre los productos existentes, el mismo criterio idempotente que usa para el
texto: si hay un PNG para ese slug y el producto todavía no lo tiene, `PATCH`.

```js
// Dentro del `if (!prod._creado) { ... }`, junto a la correccion de texto:
const urlRecorte = `https://mirroria.duckdns.org/prendas/${p.slug}.png`
if (RECORTES.has(p.slug) && prod.arOverlayImageUrl !== urlRecorte) {
  await patch(`/catalogo/productos/${prod.id}`, { arOverlayImageUrl: urlRecorte })
  recortesAsignados++
}
```

donde `RECORTES` se arma leyendo `mirroria-frontend/public/prendas/` al empezar:

```js
import { readdirSync } from 'node:fs'
const RECORTES = new Set(
  readdirSync(new URL('../mirroria-frontend/public/prendas/', import.meta.url))
    .filter((f) => f.endsWith('.png'))
    .map((f) => f.slice(0, -4)),
)
```

La URL es **absoluta** a propósito: el móvil no acepta rutas relativas.

Correr y comprobar contra el API que la cuenta de productos con recorte coincide
con la cantidad de PNG generados:

```bash
MIRRORIA_EMAIL=... MIRRORIA_PASSWORD=... node scripts/sembrar-catalogo.mjs
curl -s https://mirroria.duckdns.org/api/v1/catalogo/productos | grep -o arOverlayImageUrl | wc -l
```

- [ ] **Step 6: Commit**

```bash
git add scripts/prendas/generar-recortes.py scripts/sembrar-catalogo.mjs mirroria-frontend/public/prendas/ .gitignore
git commit -m "feat(prendas): generar los recortes del catalogo y apuntarles los productos"
```

---

### Task 5: La máquina de los tres pasos guiados

**Files:**
- Create: `mirroria-frontend/src/features/fitting/lib/pasosGuiados.ts`
- Test: `mirroria-frontend/src/features/fitting/lib/pasosGuiados.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `interface SenalesProbador { hayCamara: boolean; puntosVisibles: number; prendaElegida: boolean }`, `type EstadoPaso = "pendiente" | "activo" | "listo"`, `function calcularPasos(s: SenalesProbador): { camara: EstadoPaso; ubicacion: EstadoPaso; prenda: EstadoPaso; mensaje: string; completo: boolean }`.

`puntosVisibles` es cuántos de los dos puntos de anclaje se ven por encima del umbral (0, 1 o 2).

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
import { describe, it, expect } from "vitest"
import { calcularPasos } from "./pasosGuiados"

const senales = (p: Partial<Parameters<typeof calcularPasos>[0]> = {}) =>
  calcularPasos({ hayCamara: false, puntosVisibles: 0, prendaElegida: false, ...p })

describe("calcularPasos", () => {
  it("al entrar, el primer paso es el de la cámara y los otros esperan", () => {
    const p = senales()
    expect(p.camara).toBe("activo")
    expect(p.ubicacion).toBe("pendiente")
    expect(p.prenda).toBe("pendiente")
    expect(p.completo).toBe(false)
  })

  it("con la cámara andando, el paso activo pasa a ser ubicarse", () => {
    const p = senales({ hayCamara: true })
    expect(p.camara).toBe("listo")
    expect(p.ubicacion).toBe("activo")
  })

  it("si no se ve a nadie, lo dice con todas las letras", () => {
    expect(senales({ hayCamara: true, puntosVisibles: 0 }).mensaje).toContain("No te veo")
  })

  it("si se ve medio cuerpo, pide ponerse de frente", () => {
    expect(senales({ hayCamara: true, puntosVisibles: 1 }).mensaje).toContain("de frente")
  })

  it("con los dos puntos a la vista, toca elegir la prenda", () => {
    const p = senales({ hayCamara: true, puntosVisibles: 2 })
    expect(p.ubicacion).toBe("listo")
    expect(p.prenda).toBe("activo")
    expect(p.completo).toBe(false)
  })

  it("con los tres pasos cumplidos, el panel se da por completo", () => {
    const p = senales({ hayCamara: true, puntosVisibles: 2, prendaElegida: true })
    expect(p.completo).toBe(true)
  })

  it("si se pierde la pose, el paso 2 se vuelve a encender aunque ya haya prenda", () => {
    // Que no quede la pantalla sin prenda y sin explicacion.
    const p = senales({ hayCamara: true, puntosVisibles: 0, prendaElegida: true })
    expect(p.ubicacion).toBe("activo")
    expect(p.completo).toBe(false)
  })
})
```

- [ ] **Step 2: Correr y verla fallar**

```
cd mirroria-frontend && npx vitest run src/features/fitting/lib/pasosGuiados.test.ts
```
Esperado: FAIL, módulo inexistente.

- [ ] **Step 3: Escribir el módulo**

```ts
export interface SenalesProbador {
  hayCamara: boolean
  /** Cuántos de los dos puntos de anclaje se ven (0, 1 o 2). */
  puntosVisibles: number
  prendaElegida: boolean
}

export type EstadoPaso = "pendiente" | "activo" | "listo"

export interface PasosProbador {
  camara: EstadoPaso
  ubicacion: EstadoPaso
  prenda: EstadoPaso
  mensaje: string
  completo: boolean
}

/**
 * Traduce señales reales del sistema a los tres pasos del panel guiado.
 *
 * Ningún paso se marca porque la clienta lo diga: la cámara se marca cuando
 * llega el stream, la ubicación cuando el detector ve los dos puntos, y la
 * prenda cuando hay una elegida. Si la pose se pierde, el paso 2 se reenciende
 * aunque ya hubiera prenda: así la pantalla nunca queda sin prenda y sin
 * explicación.
 */
export function calcularPasos(s: SenalesProbador): PasosProbador {
  if (!s.hayCamara) {
    return {
      camara: "activo",
      ubicacion: "pendiente",
      prenda: "pendiente",
      mensaje: "Permití la cámara para empezar.",
      completo: false,
    }
  }

  if (s.puntosVisibles < 2) {
    return {
      camara: "listo",
      ubicacion: "activo",
      prenda: s.prendaElegida ? "listo" : "pendiente",
      mensaje:
        s.puntosVisibles === 0
          ? "No te veo: ponete a un metro y medio, de cuerpo entero."
          : "Te veo a medias: ponete de frente, con los dos hombros a la vista.",
      completo: false,
    }
  }

  return {
    camara: "listo",
    ubicacion: "listo",
    prenda: s.prendaElegida ? "listo" : "activo",
    mensaje: s.prendaElegida ? "Listo: movete y mirate." : "Elegí una prenda de la tira de abajo.",
    completo: s.prendaElegida,
  }
}
```

- [ ] **Step 4: Correr y verla pasar**

```
cd mirroria-frontend && npx vitest run src/features/fitting/lib/pasosGuiados.test.ts
```
Esperado: PASS, 7 pruebas. Luego `npm test` completo (26).

- [ ] **Step 5: Commit**

```bash
git add mirroria-frontend/src/features/fitting/lib/pasosGuiados.ts mirroria-frontend/src/features/fitting/lib/pasosGuiados.test.ts
git commit -m "feat(probador): maquina de los tres pasos guiados"
```

---

### Task 6: Cámara y detección de pose en el navegador

**Files:**
- Create: `mirroria-frontend/src/features/fitting/hooks/useCamara.ts`
- Create: `mirroria-frontend/src/features/fitting/hooks/usePose.ts`
- Create: `mirroria-frontend/public/mediapipe/` (wasm + `pose_landmarker_lite.task`)
- Modify: `mirroria-frontend/package.json` (dependencia `@mediapipe/tasks-vision`)

**Interfaces:**
- Consumes: `PuntoPose` (Tarea 1).
- Produces: `useCamara(): { stream: MediaStream | null; estado: "pidiendo" | "lista" | "denegada" | "sin-camara" | "no-soportada"; reintentar: () => void }` y `usePose(video: HTMLVideoElement | null, activo: boolean): { puntos: PuntoPose[]; listo: boolean }`.

- [ ] **Step 1: Instalar la dependencia y bajar el modelo**

```bash
cd mirroria-frontend
npm install @mediapipe/tasks-vision
mkdir -p public/mediapipe
cp node_modules/@mediapipe/tasks-vision/wasm/* public/mediapipe/
curl -L -o public/mediapipe/pose_landmarker_lite.task \
  https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task
```

Verificar que el `.task` pesa varios MB y no es una página de error: `ls -la public/mediapipe/`.

- [ ] **Step 2: Escribir `useCamara.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from "react"

export type EstadoCamara = "pidiendo" | "lista" | "denegada" | "sin-camara" | "no-soportada"

/**
 * Pide la cámara frontal y avisa por qué no se pudo cuando falla.
 *
 * Vigila también que el stream siga vivo: si alguien revoca el permiso o la
 * pestaña pierde la cámara, el hook vuelve a "denegada" en vez de dejar un
 * `<video>` congelado que parece funcionando.
 */
export function useCamara() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [estado, setEstado] = useState<EstadoCamara>("pidiendo")
  const [intento, setIntento] = useState(0)
  const vivo = useRef(true)

  const reintentar = useCallback(() => setIntento((n) => n + 1), [])

  useEffect(() => {
    vivo.current = true
    if (!navigator.mediaDevices?.getUserMedia) {
      setEstado("no-soportada")
      return
    }
    let actual: MediaStream | null = null
    setEstado("pidiendo")
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (!vivo.current) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        actual = s
        setStream(s)
        setEstado("lista")
        // Si la pista muere (permiso revocado, cámara tomada por otra app)
        // se vuelve al paso 1 con el motivo, en vez de congelarse.
        s.getVideoTracks().forEach((t) => {
          t.onended = () => {
            if (vivo.current) {
              setStream(null)
              setEstado("denegada")
            }
          }
        })
      })
      .catch((e: DOMException) => {
        if (!vivo.current) return
        setEstado(e.name === "NotFoundError" || e.name === "OverconstrainedError" ? "sin-camara" : "denegada")
      })
    return () => {
      vivo.current = false
      actual?.getTracks().forEach((t) => t.stop())
    }
  }, [intento])

  return { stream, estado, reintentar }
}
```

- [ ] **Step 3: Escribir `usePose.ts`**

```ts
import { useEffect, useRef, useState } from "react"
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision"
import type { PuntoPose } from "../lib/landmarkMath"

/**
 * Landmarks de pose del video, cuadro a cuadro.
 *
 * El wasm y el modelo salen de `public/mediapipe/`, servidos por el propio
 * sitio: no se depende de ningún CDN ajeno. Se usa el modelo `lite` a
 * propósito, que es el que corre decente en equipos modestos.
 */
export function usePose(video: HTMLVideoElement | null, activo: boolean) {
  const [puntos, setPuntos] = useState<PuntoPose[]>([])
  const [listo, setListo] = useState(false)
  const detector = useRef<PoseLandmarker | null>(null)

  useEffect(() => {
    let cancelado = false
    let cuadro = 0
    ;(async () => {
      const fileset = await FilesetResolver.forVisionTasks("/mediapipe")
      const d = await PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: "/mediapipe/pose_landmarker_lite.task" },
        runningMode: "VIDEO",
        numPoses: 1,
      })
      if (cancelado) {
        d.close()
        return
      }
      detector.current = d
      setListo(true)

      const bucle = () => {
        if (cancelado) return
        cuadro = requestAnimationFrame(bucle)
        if (!activo || !video || video.readyState < 2) return
        const r = d.detectForVideo(video, performance.now())
        const primera = r.landmarks?.[0]
        setPuntos(
          primera
            ? primera.map((p) => ({ x: p.x, y: p.y, visibility: p.visibility ?? 1 }))
            : [],
        )
      }
      cuadro = requestAnimationFrame(bucle)
    })()

    return () => {
      cancelado = true
      cancelAnimationFrame(cuadro)
      detector.current?.close()
      detector.current = null
    }
  }, [video, activo])

  return { puntos, listo }
}
```

- [ ] **Step 4: Verificar que compila y que no rompe nada**

```
cd mirroria-frontend && npx tsc -b --pretty false && npm test && npm run build
```
Esperado: typecheck sin errores, 26 pruebas en verde, build OK.

- [ ] **Step 5: Commit**

```bash
git add mirroria-frontend/package.json mirroria-frontend/package-lock.json mirroria-frontend/public/mediapipe/ mirroria-frontend/src/features/fitting/hooks/
git commit -m "feat(probador): camara y deteccion de pose en el navegador, sin CDN ajenos"
```

---

### Task 7: La pantalla del probador

**Files:**
- Create: `mirroria-frontend/src/features/fitting/components/escena-probador.tsx`
- Create: `mirroria-frontend/src/features/fitting/components/panel-guiado.tsx`
- Create: `mirroria-frontend/src/features/fitting/components/tira-de-prendas.tsx`
- Create: `mirroria-frontend/src/features/fitting/pages/ProbadorPage.tsx`
- Create: `mirroria-frontend/src/features/fitting/lib/prendasProbables.ts`
- Test: `mirroria-frontend/src/features/fitting/lib/prendasProbables.test.ts`

**Interfaces:**
- Consumes: `calcularTransformPrenda`, `ANCLA_ESTANDAR` (T1); `parDeAnclaje` (T2); `calcularPasos` (T5); `useCamara`, `usePose` (T6); `useProductos` y `useCategorias` (`@/features/catalog/hooks/...`, ya existen).
- Produces: `function prendasProbables(productos: Producto[]): Producto[]` y `function elegirPrendaInicial(productos: Producto[], id?: string): Producto | null`; el componente `ProbadorPage`.

- [ ] **Step 1: Escribir las pruebas de la selección de prendas**

```ts
import { describe, it, expect } from "vitest"
import { elegirPrendaInicial, prendasProbables } from "./prendasProbables"

const p = (id: string, arOverlayImageUrl: string | null) =>
  ({ id, arOverlayImageUrl }) as Parameters<typeof prendasProbables>[0][number]

describe("prendasProbables", () => {
  it("deja solo las prendas que tienen recorte", () => {
    expect(prendasProbables([p("1", "/prendas/a.png"), p("2", null)]).map((x) => x.id)).toEqual(["1"])
  })
})

describe("elegirPrendaInicial", () => {
  it("elige la prenda pedida cuando tiene recorte", () => {
    const lista = [p("1", "/prendas/a.png"), p("2", "/prendas/b.png")]
    expect(elegirPrendaInicial(lista, "2")?.id).toBe("2")
  })

  it("un id que no existe no rompe: abre sin prenda puesta", () => {
    // Review Focus 1
    expect(elegirPrendaInicial([p("1", "/prendas/a.png")], "999")).toBeNull()
  })

  it("un producto sin recorte tampoco se pone", () => {
    // Review Focus 1
    expect(elegirPrendaInicial([p("1", null)], "1")).toBeNull()
  })

  it("sin id no elige ninguna: la clienta elige de la tira", () => {
    expect(elegirPrendaInicial([p("1", "/prendas/a.png")])).toBeNull()
  })
})
```

- [ ] **Step 2: Correr y verla fallar**

```
cd mirroria-frontend && npx vitest run src/features/fitting/lib/prendasProbables.test.ts
```
Esperado: FAIL, módulo inexistente.

- [ ] **Step 3: Escribir `prendasProbables.ts`**

```ts
import type { Producto } from "@/features/catalog/types/catalog.types"

/** Solo se pueden probar las prendas que tienen recorte cargado. */
export function prendasProbables(productos: Producto[]): Producto[] {
  return productos.filter((p) => Boolean(p.arOverlayImageUrl))
}

/**
 * Qué prenda se pone al abrir. Un id inexistente —o el de un producto sin
 * recorte— abre el probador con la tira esperando, no con un error: la
 * clienta pudo llegar por un enlace viejo.
 */
export function elegirPrendaInicial(productos: Producto[], id?: string): Producto | null {
  if (!id) return null
  return prendasProbables(productos).find((p) => p.id === id) ?? null
}
```

- [ ] **Step 4: Correr y verla pasar**

```
cd mirroria-frontend && npx vitest run src/features/fitting/lib/prendasProbables.test.ts
```
Esperado: PASS, 4 pruebas. `npm test` completo: 30.

- [ ] **Step 5: Escribir la escena**

`escena-probador.tsx` — el video, la prenda y el bucle de render. La prenda se mueve con `transform` directo sobre el nodo, no por estado de React:

```tsx
import { useEffect, useRef } from "react"
import { ANCLA_ESTANDAR, calcularTransformPrenda, type PuntoPose } from "../lib/landmarkMath"

interface Props {
  stream: MediaStream | null
  puntos: PuntoPose[]
  par: [number, number]
  urlPrenda: string | null
  onVideo: (v: HTMLVideoElement | null) => void
  onErrorPrenda: () => void
}

export function EscenaProbador({ stream, puntos, par, urlPrenda, onVideo, onErrorPrenda }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const prenda = useRef<HTMLImageElement>(null)
  const caja = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (video.current && stream) video.current.srcObject = stream
    onVideo(video.current)
  }, [stream, onVideo])

  useEffect(() => {
    const img = prenda.current
    const cont = caja.current
    if (!img || !cont || !urlPrenda) return
    const t = calcularTransformPrenda(
      puntos[par[0]], puntos[par[1]],
      cont.clientWidth, cont.clientHeight,
      true,
      img.naturalWidth || 1, img.naturalHeight || 1,
      ANCLA_ESTANDAR,
    )
    img.style.opacity = t.visible ? "1" : "0"
    if (!t.visible) return
    img.style.width = `${t.width}px`
    img.style.height = `${t.height}px`
    img.style.transform = `translate(${t.left}px, ${t.top}px) rotate(${t.rotationDeg}deg)`
  }, [puntos, par, urlPrenda])

  return (
    <div ref={caja} className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-secondary">
      <video
        ref={video}
        autoPlay
        playsInline
        muted
        className="h-full w-full scale-x-[-1] object-cover"
      />
      {urlPrenda && (
        <img
          ref={prenda}
          src={urlPrenda}
          alt=""
          onError={onErrorPrenda}
          className="pointer-events-none absolute top-0 left-0 origin-center opacity-0 transition-opacity"
        />
      )}
    </div>
  )
}
```

- [ ] **Step 6: Escribir la pantalla de respaldo sin cámara**

`respaldo-sin-camara.tsx`: cuando `estado` es `denegada`, `sin-camara` o
`no-soportada`, en vez de una pantalla rota se ve la prenda sobre una silueta de
referencia, el motivo en palabras y las dos salidas. **El botón de reservar
funciona igual**: el probador nunca es un callejón sin salida.

```tsx
import { Link } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import type { EstadoCamara } from "../hooks/useCamara"

const MOTIVO: Record<string, string> = {
  denegada: "No nos diste permiso para usar la cámara, o se lo revocaste. Podés habilitarla desde el candado de la barra de direcciones y volver a intentar.",
  "sin-camara": "No encontramos una cámara en este equipo. Probá desde el celular.",
  "no-soportada": "Este navegador no puede abrir la cámara. Probá con Chrome, Edge o Safari actualizados.",
}

export function RespaldoSinCamara({
  estado,
  urlPrenda,
  idProducto,
  onReintentar,
}: {
  estado: EstadoCamara
  urlPrenda: string | null
  idProducto: string | null
  onReintentar: () => void
}) {
  return (
    <div className="rounded-2xl bg-secondary p-8 text-center">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-xs">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-foreground/10 to-transparent" />
        {urlPrenda && (
          <img src={urlPrenda} alt="" className="absolute inset-0 m-auto max-h-full object-contain" />
        )}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">{MOTIVO[estado]}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onReintentar} className={cn(buttonVariants())}>
          Reintentar
        </button>
        {idProducto && (
          <Link to={`/tienda/producto/${idProducto}`} className={cn(buttonVariants({ variant: "outline" }))}>
            Reservala en sucursal
          </Link>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Escribir el panel guiado y la tira**

Los dos son de presentación: no deciden nada, dibujan lo que reciben.

```tsx
// panel-guiado.tsx
import { Check } from "@phosphor-icons/react"
import type { EstadoPaso, PasosProbador } from "../lib/pasosGuiados"

const CLASES: Record<EstadoPaso, string> = {
  pendiente: "text-muted-foreground/60",
  activo: "text-primary font-medium",
  listo: "text-foreground",
}

function Paso({ n, texto, estado }: { n: number; texto: string; estado: EstadoPaso }) {
  return (
    <li className={`flex items-center gap-2 text-sm ${CLASES[estado]}`}>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-current">
        {estado === "listo" ? <Check className="size-3.5" weight="bold" /> : n}
      </span>
      {texto}
    </li>
  )
}

export function PanelGuiado({ pasos }: { pasos: PasosProbador }) {
  return (
    <div className="rounded-2xl border border-border bg-background/95 p-4">
      <ol className="flex flex-col gap-2">
        <Paso n={1} texto="Permití la cámara" estado={pasos.camara} />
        <Paso n={2} texto="Ubicate de frente, a metro y medio" estado={pasos.ubicacion} />
        <Paso n={3} texto="Elegí la prenda" estado={pasos.prenda} />
      </ol>
      <p className="mt-3 text-sm text-muted-foreground">{pasos.mensaje}</p>
    </div>
  )
}
```

```tsx
// tira-de-prendas.tsx
import type { Producto } from "@/features/catalog/types/catalog.types"

export function TiraDePrendas({
  prendas,
  elegidaId,
  onElegir,
}: {
  prendas: Producto[]
  elegidaId: string | null
  onElegir: (p: Producto) => void
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {prendas.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onElegir(p)}
          className={`shrink-0 overflow-hidden rounded-xl border-2 text-left ${
            p.id === elegidaId ? "border-primary" : "border-transparent"
          }`}
        >
          <img src={p.imagenes?.[0]?.url} alt="" className="h-24 w-20 object-cover" loading="lazy" />
          <span className="block max-w-20 truncate px-1 py-1 text-xs">{p.titulo}</span>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 8: Escribir `ProbadorPage.tsx`**

Es el único lugar donde se juntan las piezas; todo lo que decide algo ya está probado por unidad.

```tsx
import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useCategorias } from "@/features/catalog/hooks/useCategorias"
import { useProductos } from "@/features/catalog/hooks/useProductos"
import type { Producto } from "@/features/catalog/types/catalog.types"
import { EscenaProbador } from "../components/escena-probador"
import { PanelGuiado } from "../components/panel-guiado"
import { RespaldoSinCamara } from "../components/respaldo-sin-camara"
import { TiraDePrendas } from "../components/tira-de-prendas"
import { useCamara } from "../hooks/useCamara"
import { usePose } from "../hooks/usePose"
import { VISIBILIDAD_MINIMA } from "../lib/landmarkMath"
import { parDeAnclaje } from "../lib/parDeAnclaje"
import { calcularPasos } from "../lib/pasosGuiados"
import { elegirPrendaInicial, prendasProbables } from "../lib/prendasProbables"

export function ProbadorPage() {
  const { productoId } = useParams()
  const { productos } = useProductos()
  const { categorias } = useCategorias()
  const { stream, estado, reintentar } = useCamara()
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const { puntos } = usePose(video, estado === "lista")
  const [prenda, setPrenda] = useState<Producto | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const probables = prendasProbables(productos)

  // La prenda del enlace se aplica una sola vez, cuando el catalogo llego.
  useEffect(() => {
    if (!prenda && productos.length) setPrenda(elegirPrendaInicial(productos, productoId))
  }, [productos, productoId, prenda])

  const slug = categorias.find((c) => c.id === prenda?.categoriaId)?.slug ?? ""
  const par = parDeAnclaje(slug)
  const visibles = par.filter((i) => (puntos[i]?.visibility ?? 0) >= VISIBILIDAD_MINIMA).length

  const pasos = calcularPasos({
    hayCamara: estado === "lista",
    puntosVisibles: visibles,
    prendaElegida: Boolean(prenda),
  })

  // Review Focus 3: si el PNG no carga se suelta la prenda y se avisa, pero la
  // escena y el bucle de render siguen vivos.
  const alFallarLaPrenda = useCallback(() => {
    setAviso("Esa prenda no se pudo cargar. Prob\u00e1 con otra.")
    setPrenda(null)
  }, [])

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_20rem]">
      <div>
        {estado === "lista" ? (
          <EscenaProbador
            stream={stream}
            puntos={puntos}
            par={par}
            urlPrenda={prenda?.arOverlayImageUrl ?? null}
            onVideo={setVideo}
            onErrorPrenda={alFallarLaPrenda}
          />
        ) : estado === "pidiendo" ? (
          <div className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-secondary" />
        ) : (
          <RespaldoSinCamara
            estado={estado}
            urlPrenda={prenda?.arOverlayImageUrl ?? null}
            idProducto={prenda?.id ?? null}
            onReintentar={reintentar}
          />
        )}
        <div className="mt-4">
          <TiraDePrendas prendas={probables} elegidaId={prenda?.id ?? null} onElegir={setPrenda} />
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Probador virtual</h1>
        <PanelGuiado pasos={pasos} />
        {aviso && <p className="text-sm text-destructive">{aviso}</p>}
      </aside>
    </div>
  )
}
```

Los botones de sacar foto y reservar se agregan en este mismo archivo: el de
reservar es un `Link` a `/tienda/producto/${prenda.id}`, y el de la foto dibuja
el `<video>` y la prenda en un `<canvas>` del tamaño de la escena y dispara la
descarga con un `<a download>`.

- [ ] **Step 9: Verificar que compila**

```
cd mirroria-frontend && npx tsc -b --pretty false && npm test && npm run build
```
Esperado: typecheck limpio, 30 pruebas, build OK.

- [ ] **Step 10: Commit**

```bash
git add mirroria-frontend/src/features/fitting/
git commit -m "feat(probador): pantalla del probador con menu guiado y tira de prendas"
```

---

### Task 8: Las entradas al probador

**Files:**
- Modify: `mirroria-frontend/src/App.tsx` (tabla `STOREFRONT_ROUTES`)
- Modify: `mirroria-frontend/src/layouts/site-footer/site-footer.data.ts`
- Modify: `mirroria-frontend/src/layouts/site-header/categories-menu.tsx` o el dato que alimenta el menú
- Modify: `mirroria-frontend/src/features/catalog/components/product-detail/` (el botón «Probármelo»)
- Test: `mirroria-frontend/src/layouts/site-footer/site-footer.data.test.ts` (ya existe; se le agrega un caso)

**Interfaces:**
- Consumes: `ProbadorPage` (T7).
- Produces: las rutas `/probador` y `/probador/:productoId`.

- [ ] **Step 1: Escribir la prueba del pie que falla**

Agregar a `site-footer.data.test.ts`:

```ts
it("«Vestidor virtual» lleva al probador y no a un ancla del inicio", () => {
  expect(buscar("Vestidor virtual")?.href).toBe("/probador")
})
```

- [ ] **Step 2: Correr y verla fallar**

```
cd mirroria-frontend && npx vitest run src/layouts/site-footer/site-footer.data.test.ts
```
Esperado: FAIL, recibido `"#vestidor"`.

- [ ] **Step 3: Cambiar el dato y agregar las rutas**

En `site-footer.data.ts`, `{ label: "Vestidor virtual", href: "/probador" }`. En `App.tsx`, agregar a `STOREFRONT_ROUTES`, **antes** del comodín `{ path: "*" }`:

```ts
  { path: "/probador", Component: ProbadorPage },
  { path: "/probador/:productoId", Component: ProbadorPage },
```

con `import { ProbadorPage } from "@/features/fitting/pages/ProbadorPage"`. Son rutas públicas a propósito: probarse una prenda no necesita cuenta.

- [ ] **Step 4: Agregar el botón «Probármelo» en la ficha**

En el detalle del producto, junto a «Agregar al carrito»: un `Link` a `/probador/${producto.id}` que **solo se dibuja si `producto.arOverlayImageUrl`**. Texto: «Probármela». Variante `outline`, para no competir con el botón principal.

- [ ] **Step 5: Correr todo y compilar**

```
cd mirroria-frontend && npx vitest run && npx tsc -b --pretty false && npm run build
```
Esperado: 31 pruebas en verde, typecheck limpio, build OK.

- [ ] **Step 6: Commit**

```bash
git add mirroria-frontend/src
git commit -m "feat(probador): entradas desde la ficha, el menu y el pie"
```

---

### Task 9: Verificación en un navegador real

**Files:**
- Create: `scripts/probar-probador.cjs`
- Create: `scripts/.trabajo/` (salida de capturas, ignorada por git)

**Interfaces:**
- Consumes: el sitio compilado y servido en local.
- Produces: capturas y un informe por consola.

- [ ] **Step 1: Escribir el recorrido con cámara falsa**

`scripts/probar-probador.cjs` levanta Chromium con la cámara simulada y recorre el probador:

```js
const { chromium } = require('playwright')

// Chromium puede simular una camara alimentada por un archivo: asi se prueba
// el probador sin webcam. El .y4m tiene que tener una PERSONA para que el
// detector de pose encuentre algo.
const ARGS = [
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',
  `--use-file-for-fake-video-capture=${process.env.VIDEO}`,
]

;(async () => {
  const browser = await chromium.launch({ args: ARGS })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errores = []
  page.on('pageerror', (e) => errores.push(String(e).slice(0, 200)))
  await page.goto(process.env.BASE + '/probador', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(8000)   // wasm + modelo + primeros cuadros
  const d = await page.evaluate(() => ({
    texto: document.body.innerText.replace(/\s+/g, ' ').slice(0, 300),
    hayVideo: !!document.querySelector('video'),
    prendaVisible: [...document.images].some((i) => i.src.includes('/prendas/') && i.style.opacity === '1'),
  }))
  console.log(d)
  await page.screenshot({ path: process.env.OUT + '/probador.png', fullPage: true })
  if (errores.length) console.log('ERRORES JS:', [...new Set(errores)])
  await browser.close()
})()
```

- [ ] **Step 2: Correrlo contra el sitio local**

```
cd mirroria-frontend && VITE_API_URL=https://mirroria.duckdns.org/api/v1 npx vite --port 5178 &
VIDEO=<ruta a un .y4m con una persona> BASE=http://localhost:5178 OUT=scripts/.trabajo node scripts/probar-probador.cjs
```

Esperado: el `<video>` existe, el panel guiado avanza y no hay errores de JS.

- [ ] **Step 3: Anotar el resultado del detector**

**Riesgo declarado en el diseño:** puede que la pose no se detecte en el video falso. Si `prendaVisible` es `false`, comprobar en la captura si el panel quedó en el paso 2 («No te veo»). Si es así, la prueba automática **cubre permisos, carga del modelo y el panel guiado**, y el seguimiento del cuerpo queda para la revisión a ojo. Anotarlo en el commit, sin declararlo cubierto.

- [ ] **Step 4: Revisión con una persona de verdad**

Abrir `http://localhost:5178/probador` con una webcam, pararse a metro y medio y comprobar: la prenda cae sobre los hombros (o la cintura, en una falda), acompaña al inclinarse, escala al acercarse y desaparece al salir de cuadro. Sacar una captura.

- [ ] **Step 5: Commit**

```bash
git add scripts/probar-probador.cjs .gitignore
git commit -m "test(probador): recorrido en navegador con camara simulada"
```

---

## Cuando esté todo

1. `npm test` en `mirroria-frontend` y `python test_recorte.py` en `scripts/prendas`: todo en verde.
2. Comprobar en el API que la cantidad de productos con `arOverlayImageUrl` coincide con la de PNG generados (se hace en la Tarea 4, paso 5).
3. Pedirle a Leonardo el redespliegue del frontend: nada de esto se ve en producción hasta entonces.
