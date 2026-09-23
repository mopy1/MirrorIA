"use strict"

// Verificacion en un navegador real del probador virtual (/probador), con
// camara simulada por archivo. Cubre el camino feliz (permiso -> deteccion de
// pose -> prenda anclada) y los dos caminos de error mas baratos de simular:
// sin camara, y prenda cuyo PNG no carga.
//
// Playwright NO es dependencia de este repo: se usa la instalacion que ya
// existe en la maquina, resuelta por ruta absoluta (por nombre buscaria
// relativo a este script y fallaria).
const { chromium } = require("C:/dev/forja/herramientas/node_modules/playwright")

const path = require("node:path")
const fs = require("node:fs")

const BASE = process.env.BASE || "http://localhost:5178"
const VIDEO = process.env.VIDEO
const OUT = process.env.OUT || path.join(__dirname, ".trabajo")
const API_BASE = process.env.VITE_API_URL || "https://mirroria.duckdns.org/api/v1"
const CARPETA_PRENDAS_LOCAL = path.join(__dirname, "..", "mirroria-frontend", "public", "prendas")

if (!VIDEO) {
  console.error("Falta VIDEO=<ruta al .y4m con una persona>")
  process.exit(1)
}

fs.mkdirSync(OUT, { recursive: true })

const ARGS_CAMARA_FALSA = [
  "--use-fake-ui-for-media-stream",
  "--use-fake-device-for-media-stream",
  `--use-file-for-fake-video-capture=${VIDEO}`,
]

function log(...args) {
  console.log(...args)
}

// El catalogo de produccion (mirroria.duckdns.org) todavia no tiene el
// redespliegue del frontend con los recortes: sus PNG de prenda existen en
// este repo (mirroria-frontend/public/prendas) pero las URLs absolutas que
// trae el API todavia no resuelven en ese dominio. Sin esta interceptacion,
// la prueba ejercitaria SIEMPRE el camino de error (prenda que no carga) en
// vez del camino feliz. Se intercepta la peticion y se sirve el archivo
// local con el mismo nombre, salvo que se pida forzar un 404 (para probar
// el camino de error a proposito).
async function interceptarPrendas(page, { archivoQueFalla } = {}) {
  const contador = { fallidos: 0, totalParaElQueFalla: 0 }
  await page.route("https://mirroria.duckdns.org/prendas/**/*.png", async (route) => {
    const url = route.request().url()
    const archivo = decodeURIComponent(url.split("/").pop())
    if (archivoQueFalla && archivo === archivoQueFalla) {
      contador.fallidos++
      contador.totalParaElQueFalla++
      await route.fulfill({ status: 404, contentType: "text/plain", body: "no encontrado (simulado)" })
      return
    }
    const rutaLocal = path.join(CARPETA_PRENDAS_LOCAL, archivo)
    if (fs.existsSync(rutaLocal)) {
      await route.fulfill({ path: rutaLocal, contentType: "image/png" })
    } else {
      // No debería pasar (las 13 prendas probables tienen su PNG local),
      // pero si pasara, mejor dejar pasar la petición real que colgar la ruta.
      await route.continue()
    }
  })
  return contador
}

// Trae el catalogo real (el mismo API que usa el frontend) para saber, sin
// inventar datos, cual es una prenda con recorte y cual es su archivo PNG:
// asi la prueba puede elegirla por su titulo en la tira y, en el camino de
// error, saber exactamente que archivo hacer fallar.
async function primeraPrendaConRecorte() {
  const res = await fetch(`${API_BASE}/catalogo/productos`)
  if (!res.ok) throw new Error(`API de catalogo respondio ${res.status}`)
  const productos = await res.json()
  const conRecorte = productos.find((p) => p.arOverlayImageUrl)
  if (!conRecorte) throw new Error("no hay ningun producto con arOverlayImageUrl en el catalogo")
  const archivo = decodeURIComponent(conRecorte.arOverlayImageUrl.split("/").pop())
  return { titulo: conRecorte.titulo, archivo }
}

// Lee la clase del <li> de un paso del panel guiado para decidir su estado.
// Las tres clases (pendiente/activo/listo) son literales en panel-guiado.tsx
// y no se combinan entre si, asi que basta con buscar la que corresponde a
// "listo": "text-foreground".
function fabricarEsperaDePaso(pagina, indice) {
  return pagina.waitForFunction(
    (i) => {
      const li = document.querySelectorAll("aside ol li")[i]
      return !!li && li.className.includes("text-foreground")
    },
    indice,
    { timeout: 25000 },
  )
}

// El propio runtime de TFLite/XNNPACK (que carga @mediapipe/tasks-vision)
// imprime una linea informativa por console.error, no un error real: se
// registra aparte para no ensuciar (ni esconder) los errores de JS de verdad.
const RUIDO_CONOCIDO = /^INFO: Created TensorFlow Lite XNNPACK delegate/

async function instalarCapturaDeErrores(page, bolsa, ruido) {
  page.on("pageerror", (e) => bolsa.push(`pageerror: ${String(e).slice(0, 300)}`))
  page.on("console", (msg) => {
    if (msg.type() !== "error") return
    const texto = msg.text().slice(0, 300)
    if (RUIDO_CONOCIDO.test(texto)) ruido?.push(texto)
    else bolsa.push(`console.error: ${texto}`)
  })
}

// --- Escenario 1: camino feliz -------------------------------------------
async function probarCaminoFeliz(browser, prendaObjetivo) {
  log("\n=== Escenario 1: camino feliz (camara simulada + prenda con recorte) ===")
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  const errores = []
  const ruido = []
  await instalarCapturaDeErrores(page, errores, ruido)
  await interceptarPrendas(page)

  await page.goto(BASE + "/probador", { waitUntil: "domcontentloaded", timeout: 60000 })

  await page.waitForSelector("video", { timeout: 15000 })
  log("video presente: OK")

  await fabricarEsperaDePaso(page, 0) // paso 1: camara
  log("paso 1 (camara) en listo: OK")

  await fabricarEsperaDePaso(page, 1) // paso 2: ubicacion (requiere pose)
  log("paso 2 (ubicacion) en listo: OK — el detector encontro los dos hombros en el video simulado")

  // Elige, por titulo, la misma prenda que el API dice que tiene recorte.
  const boton = page.locator("button", { hasText: prendaObjetivo.titulo })
  await boton.first().click()
  log(`prenda elegida: ${prendaObjetivo.titulo}`)

  await fabricarEsperaDePaso(page, 2) // paso 3: prenda elegida
  log("paso 3 (prenda) en listo: OK")

  // Espera a que el efecto de anclaje corra sobre un cuadro con pose real.
  await page.waitForFunction(
    () => {
      const img = document.querySelector('img[alt=""].pointer-events-none')
      return !!img && img.style.opacity === "1" && img.style.transform.includes("translate")
    },
    { timeout: 15000 },
  )

  const datos = await page.evaluate(() => {
    const caja = document.querySelector(".relative.aspect-\\[3\\/4\\]")
    const img = document.querySelector('img[alt=""].pointer-events-none')
    const m = img.style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/)
    return {
      opacity: img.style.opacity,
      transform: img.style.transform,
      translateX: m ? Number(m[1]) : null,
      translateY: m ? Number(m[2]) : null,
      cajaAncho: caja.clientWidth,
      cajaAlto: caja.clientHeight,
      imgAncho: img.style.width,
      imgAlto: img.style.height,
    }
  })
  log("transform de la prenda:", datos)

  const dentroDelRecuadro =
    datos.translateX !== null &&
    datos.translateY !== null &&
    datos.translateX > -datos.cajaAncho &&
    datos.translateX < datos.cajaAncho * 2 &&
    datos.translateY > -datos.cajaAlto &&
    datos.translateY < datos.cajaAlto * 2

  log(
    dentroDelRecuadro
      ? "anclaje: OK — opacity=1 y translate con numeros plausibles dentro/cerca del recuadro"
      : "anclaje: FALLA — translate fuera de rango razonable",
  )

  await page.screenshot({ path: path.join(OUT, "1-camino-feliz.png"), fullPage: true })
  // Recorte de solo la escena (video + prenda), mas facil de mirar a ojo.
  await page.locator(".relative.aspect-\\[3\\/4\\]").first().screenshot({
    path: path.join(OUT, "1-camino-feliz-escena.png"),
  })

  if (errores.length) log("ERRORES JS:", [...new Set(errores)])
  else log("errores de JS en consola: ninguno")
  if (ruido.length) log(`(ademas, ${ruido.length} lineas de ruido conocido del motor TFLite, ignoradas)`)

  await context.close()
  return { opacityOk: datos.opacity === "1", dentroDelRecuadro, errores }
}

// --- Escenario 2: sin camara ----------------------------------------------
// Se lanza SIN las banderas de camara simulada. En una maquina sin webcam
// (o donde Chromium headless no encuentra ninguna) getUserMedia rechaza con
// NotFoundError y el hook useCamara() cae en "sin-camara": exactamente el
// camino que hay que comprobar, sin tener que fingir el rechazo.
async function probarSinCamara(browser) {
  log("\n=== Escenario 2: sin camara (sin banderas de fake device) ===")
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  const errores = []
  const ruido = []
  await instalarCapturaDeErrores(page, errores, ruido)
  await interceptarPrendas(page)

  await page.goto(BASE + "/probador", { waitUntil: "domcontentloaded", timeout: 60000 })

  // Ojo: NO alcanza con esperar a que aparezca la palabra "cámara" en la
  // pantalla — el paso 1 del panel guiado ya dice "Permití la cámara" desde
  // el primer render, con la cámara todavía "pidiendo" permiso. Hay que
  // esperar a la pantalla de RESPALDO en particular (el botón "Reintentar"
  // que solo pinta `RespaldoSinCamara`), o esta prueba pasaría en falso
  // mientras la cámara sigue cargando.
  await page.waitForFunction(
    () => [...document.querySelectorAll("button")].some((b) => b.textContent?.includes("Reintentar")),
    { timeout: 20000 },
  )

  const texto = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 400))
  const hayBotonReintentar = await page.locator("button", { hasText: "Reintentar" }).count()
  const hayVideo = (await page.locator("video").count()) > 0

  log("texto visible:", texto)
  log("boton Reintentar presente:", hayBotonReintentar > 0)
  log("hay <video> (no deberia, es la pantalla de respaldo):", hayVideo)

  await page.screenshot({ path: path.join(OUT, "2-sin-camara.png"), fullPage: true })

  if (errores.length) log("ERRORES JS:", [...new Set(errores)])
  else log("errores de JS en consola: ninguno")

  await context.close()
  return { texto, hayBotonReintentar: hayBotonReintentar > 0, hayVideo, errores }
}

// --- Escenario 3: prenda que no carga --------------------------------------
async function probarPrendaQueNoCarga(browser, prendaObjetivo) {
  log("\n=== Escenario 3: prenda cuyo PNG no carga (404 forzado por ruteo) ===")
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  const errores = []
  const ruido = []
  await instalarCapturaDeErrores(page, errores, ruido)
  const contador = await interceptarPrendas(page, { archivoQueFalla: prendaObjetivo.archivo })

  await page.goto(BASE + "/probador", { waitUntil: "domcontentloaded", timeout: 60000 })
  await page.waitForSelector("video", { timeout: 15000 })
  await fabricarEsperaDePaso(page, 0)
  await fabricarEsperaDePaso(page, 1)

  const boton = page.locator("button", { hasText: prendaObjetivo.titulo })
  await boton.first().click()
  log(`prenda elegida (con PNG forzado a 404): ${prendaObjetivo.titulo}`)

  await page.waitForFunction(
    () => document.body.innerText.includes("no se pudo cargar"),
    { timeout: 15000 },
  )
  log("aviso de error visible: OK")

  // Espera unos segundos mas para ver si el componente reintenta solo la
  // misma imagen (bucle de reintentos): no deberia, `alFallarLaPrenda` suelta
  // la prenda y la marca en `fallidas` para que no se vuelva a elegir.
  await page.waitForTimeout(4000)

  const hayVideoTrasElError = (await page.locator("video").count()) > 0
  const botonSigueDeshabilitado = await page.evaluate((titulo) => {
    const botones = [...document.querySelectorAll("button")]
    const b = botones.find((el) => el.textContent?.includes(titulo))
    return b ? b.disabled : null
  }, prendaObjetivo.titulo)

  log("escena sigue viva (<video> presente tras el error):", hayVideoTrasElError)
  log(`pedidos del PNG forzado a 404 (${prendaObjetivo.archivo}):`, contador.fallidos)
  log("boton de la prenda fallida queda deshabilitado:", botonSigueDeshabilitado)

  await page.screenshot({ path: path.join(OUT, "3-prenda-no-carga.png"), fullPage: true })

  // El "Failed to load resource: ... 404" es el propio Chromium anotando la
  // petición que ESTE escenario hizo fallar a propósito (ver interceptarPrendas):
  // no es una excepción de JS de la app, así que no cuenta como error real acá.
  const erroresReales = errores.filter((e) => !/Failed to load resource:.*404/.test(e))
  if (erroresReales.length) log("ERRORES JS:", [...new Set(erroresReales)])
  else log("errores de JS en consola: ninguno (el 404 de red esperado no cuenta)")

  await context.close()
  return {
    hayVideoTrasElError,
    pedidosFallidos: contador.fallidos,
    botonSigueDeshabilitado,
    errores: erroresReales,
  }
}

;(async () => {
  const prendaObjetivo = await primeraPrendaConRecorte()
  log("prenda de referencia (primera con recorte segun el API):", prendaObjetivo)

  const browserConCamara = await chromium.launch({ args: ARGS_CAMARA_FALSA })
  const browserSinFlags = await chromium.launch()

  const resultados = {}
  try {
    resultados.feliz = await probarCaminoFeliz(browserConCamara, prendaObjetivo)
    resultados.sinCamara = await probarSinCamara(browserSinFlags)
    resultados.prendaRota = await probarPrendaQueNoCarga(browserConCamara, prendaObjetivo)
  } finally {
    await browserConCamara.close()
    await browserSinFlags.close()
  }

  log("\n=== Resumen ===")
  log(JSON.stringify(resultados, null, 2))

  const fallo =
    !resultados.feliz.opacityOk ||
    !resultados.feliz.dentroDelRecuadro ||
    resultados.feliz.errores.length > 0 ||
    !resultados.sinCamara.hayBotonReintentar ||
    resultados.sinCamara.hayVideo ||
    resultados.sinCamara.errores.length > 0 ||
    !resultados.prendaRota.hayVideoTrasElError ||
    resultados.prendaRota.pedidosFallidos > 5 ||
    resultados.prendaRota.errores.length > 0

  if (fallo) {
    console.error("\nALGO NO CUMPLIO LO ESPERADO — revisar el detalle de arriba y las capturas en", OUT)
    process.exitCode = 1
  } else {
    log("\nTodo lo comprobado automaticamente salio como se esperaba.")
  }
})().catch((e) => {
  console.error("Error corriendo la prueba:", e)
  process.exitCode = 1
})
