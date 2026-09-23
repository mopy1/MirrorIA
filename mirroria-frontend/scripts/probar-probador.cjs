"use strict"

// Verificacion en un navegador real del probador virtual (/probador), con
// camara simulada por archivo. Cubre el camino feliz (permiso -> deteccion de
// pose -> prenda anclada), los dos caminos de error mas baratos de simular
// (sin camara, y prenda cuyo PNG no carga), la descarga de la foto y el
// layout en un telefono.
//
// Como correrlo (desde mirroria-frontend/):
//
//   npm install                       # trae playwright, que es devDependency
//   npx playwright install chromium   # la primera vez en cada maquina
//   python ../scripts/prendas/hacer-video-de-prueba.py scripts/.trabajo/persona.y4m
//   npm run build && npm run preview -- --port 5178
//   npm run e2e:probador
//
// El .y4m NO esta commiteado (13 MB): se fabrica con el script de Python de
// arriba, que baja una foto de una persona de cuerpo entero y la repite en
// cuadros. El recorrido pega contra el API de PRODUCCION
// (https://mirroria.duckdns.org/api/v1) para saber que prenda tiene recorte;
// los PNG de las prendas, en cambio, se sirven desde el repo (ver
// `interceptarPrendas`).
const { chromium } = require("playwright")

const path = require("node:path")
const fs = require("node:fs")
const http = require("node:http")

const BASE = process.env.BASE || "http://localhost:5178"
const OUT = process.env.OUT || path.join(__dirname, ".trabajo")
const VIDEO = process.env.VIDEO || path.join(OUT, "persona.y4m")
const API_BASE = process.env.VITE_API_URL || "https://mirroria.duckdns.org/api/v1"
const CARPETA_PRENDAS_LOCAL = path.join(__dirname, "..", "public", "prendas")
const CARPETA_MEDIAPIPE_PUBLIC = path.join(__dirname, "..", "public", "mediapipe")
const VISION_BUNDLE = path.join(
  __dirname, "..", "node_modules", "@mediapipe", "tasks-vision", "vision_bundle.mjs",
)

fs.mkdirSync(OUT, { recursive: true })

if (!fs.existsSync(VIDEO)) {
  console.error(`No esta el video de la camara simulada: ${VIDEO}`)
  console.error("Fabricalo (pesa ~13 MB, por eso no se commitea):")
  console.error(`  python ../scripts/prendas/hacer-video-de-prueba.py "${VIDEO}"`)
  process.exit(1)
}

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
//
// Se responde con `Access-Control-Allow-Origin: *` a proposito: la foto que
// arma `sacarFoto` vuelve a pedir el PNG con crossOrigin="anonymous" (para no
// contaminar el canvas), y sin ese encabezado el navegador rechaza la imagen
// y la foto saldria sin la prenda. Asi el escenario de la foto ejercita el
// camino bueno, no el degradado.
async function interceptarPrendas(page, { archivoQueFalla } = {}) {
  const contador = { fallidos: 0, totalParaElQueFalla: 0 }
  const CORS = { "Access-Control-Allow-Origin": "*" }
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
      await route.fulfill({ path: rutaLocal, contentType: "image/png", headers: CORS })
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

// --- Sonda independiente de pose ------------------------------------------
//
// La primera versión de esta prueba solo comprobaba que el <img> de la
// prenda quedara con opacity:1 y un translate() con números "razonables"
// (dentro de +/- un recuadro entero). Eso no prueba que la prenda caiga
// SOBRE el cuerpo: una revisión encontró que, con esa cota tan floja, la
// prenda podía flotar lejos del cuerpo (como de hecho pasó una vez) y la
// prueba la daba por buena igual.
//
// Para probar el anclaje de verdad hace falta un punto de comparación
// independiente de lo que calcula la propia app: dónde están REALMENTE los
// hombros de la persona en pantalla. Como `persona.y4m` es una sola foto
// repetida (ver `scripts/prendas/hacer-video-de-prueba.py`), correr el
// detector de pose una sola vez alcanza: el resultado es el mismo en
// cualquier cuadro. Así que esta sonda levanta un servidor HTTP efímero que
// sirve el mismo paquete `@mediapipe/tasks-vision` y los mismos archivos de
// `public/mediapipe/` que ya usa la app (sin tocarlos ni importarlos desde
// el código de la app: es una carga aparte, en una pestaña aparte), abre
// una pestaña en blanco que pide la MISMA cámara falsa y corre el detector
// una vez. De ahí salen los landmarks crudos (sin mirar en ningún momento
// el código de `features/fitting/`).
//
// El mapeo de esos landmarks a píxeles de pantalla (proyeccion tipo
// object-fit:cover + espejado) se reimplementa acá desde cero, a partir de
// la semántica estándar de CSS `object-fit: cover` (no se importa
// `proyeccionCover.ts` de la app): así la comparación es realmente
// independiente y no puede pasar en verde solo porque comparte un bug con
// el código que se está verificando.
function contentTypeDeSonda(nombre) {
  if (nombre.endsWith(".mjs") || nombre.endsWith(".js")) return "text/javascript"
  if (nombre.endsWith(".wasm")) return "application/wasm"
  if (nombre.endsWith(".task")) return "application/octet-stream"
  return "application/octet-stream"
}

const HTML_SONDA = `<!doctype html><html><body>
<video id="v" autoplay playsinline muted style="width:640px;height:480px"></video>
<script type="module">
  import { FilesetResolver, PoseLandmarker } from "/vision_bundle.mjs"
  ;(async () => {
    const video = document.getElementById("v")
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    video.srcObject = stream
    await video.play()
    while (video.readyState < 2) await new Promise((r) => setTimeout(r, 50))
    const fileset = await FilesetResolver.forVisionTasks("/mediapipe")
    const detector = await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: "/mediapipe/pose_landmarker_lite.task" },
      runningMode: "VIDEO",
      numPoses: 1,
    })
    let r = null
    for (let i = 0; i < 10 && !(r && r.landmarks && r.landmarks.length); i++) {
      await new Promise((res) => requestAnimationFrame(res))
      r = detector.detectForVideo(video, performance.now())
    }
    window.__resultadoSonda = {
      landmarks: r && r.landmarks && r.landmarks[0] ? r.landmarks[0] : null,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
    }
  })().catch((e) => {
    // Algunos loaders de WASM rechazan con el Event de "error" del <script>
    // en vez de con un Error real: de ahi que no alcance con String(e) (da
    // "[object Event]"). Se prioriza el tipo de evento y el src del target.
    let detalle = ""
    if (e && e.target && e.target.tagName) detalle = \` tagName=\${e.target.tagName} src=\${e.target.src || e.target.currentSrc || ""}\`
    const msg = (e && e.stack) || (e && e.message) || (e && e.type ? "Event tipo=" + e.type + detalle : null) || String(e)
    window.__resultadoSonda = { error: msg }
  })
</script>
</body></html>`

async function levantarServidorDeSonda() {
  const archivosMediapipe = new Set(fs.readdirSync(CARPETA_MEDIAPIPE_PUBLIC))
  const server = http.createServer((req, res) => {
    const ruta = req.url.split("?")[0]
    if (ruta === "/" || ruta === "/index.html") {
      res.writeHead(200, { "Content-Type": "text/html" })
      res.end(HTML_SONDA)
      return
    }
    if (ruta === "/vision_bundle.mjs") {
      res.writeHead(200, { "Content-Type": "text/javascript" })
      fs.createReadStream(VISION_BUNDLE).pipe(res)
      return
    }
    // Ojo: FilesetResolver.forVisionTasks NO acepta "/" como base (arma
    // "//archivo.js", que el navegador interpreta como protocol-relative URL
    // y termina pidiendo "http://archivo.js/" como si fuera un host). Por
    // eso los assets de mediapipe van bajo "/mediapipe/", igual que ya hace
    // la app real en `public/mediapipe` (usePose.ts: forVisionTasks("/mediapipe")).
    const nombre = ruta.replace(/^\/mediapipe\//, "")
    if (ruta.startsWith("/mediapipe/") && archivosMediapipe.has(nombre)) {
      res.writeHead(200, { "Content-Type": contentTypeDeSonda(nombre) })
      fs.createReadStream(path.join(CARPETA_MEDIAPIPE_PUBLIC, nombre)).pipe(res)
      return
    }
    res.writeHead(404)
    res.end("no encontrado")
  })
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  const { port } = server.address()
  return { server, url: `http://127.0.0.1:${port}/` }
}

// Reproduce `object-fit: cover` + el espejado por CSS (`scale-x-[-1]`) del
// <video> de la escena, desde cero: agranda el video hasta tapar el
// contenedor (escala = máximo de las dos razones ancho/alto, no el mínimo:
// "cover" recorta el sobrante en vez de dejar barras), lo centra, y espeja
// el resultado en torno al centro del contenedor (el <video> mide 100% del
// ancho del contenedor y el espejo es una transformación CSS sobre el
// propio elemento).
function proyectarComoObjectCover(puntoNormalizado, anchoVideo, altoVideo, anchoContenedor, altoContenedor) {
  const escala = Math.max(anchoContenedor / anchoVideo, altoContenedor / altoVideo)
  const anchoMostrado = anchoVideo * escala
  const altoMostrado = altoVideo * escala
  const offsetX = (anchoContenedor - anchoMostrado) / 2
  const offsetY = (altoContenedor - altoMostrado) / 2
  const sinEspejar = { x: offsetX + puntoNormalizado.x * anchoMostrado, y: offsetY + puntoNormalizado.y * altoMostrado }
  return { x: anchoContenedor - sinEspejar.x, y: sinEspejar.y }
}

async function medirCentroDelCuerpoIndependiente(browser) {
  const { server, url } = await levantarServidorDeSonda()
  try {
    const context = await browser.newContext()
    const page = await context.newPage()
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })
      await page.waitForFunction(() => window.__resultadoSonda, { timeout: 30000 })
      const resultado = await page.evaluate(() => window.__resultadoSonda)
      if (resultado.error) throw new Error("la sonda de pose independiente fallo: " + resultado.error)
      if (!resultado.landmarks) throw new Error("la sonda independiente no detecto ninguna pose en el video")
      return resultado
    } finally {
      await context.close()
    }
  } finally {
    server.close()
  }
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

  // Que archivos de `public/mediapipe/` pide REALMENTE el navegador: ahi se
  // ve cual de las tres variantes de wasm (simd / module / nosimd) se usa y
  // cuales son 11 MB de repo que nadie baja nunca.
  const pedidosMediapipe = []
  page.on("response", async (res) => {
    const url = res.url()
    if (!url.includes("/mediapipe/")) return
    const largo = Number(res.headers()["content-length"] || 0)
    pedidosMediapipe.push({ archivo: url.split("/").pop(), estado: res.status(), bytes: largo })
  })

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
    const video = document.querySelector("video")
    const img = document.querySelector('img[alt=""].pointer-events-none')
    const m = img.style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/)
    return {
      opacity: img.style.opacity,
      transform: img.style.transform,
      translateX: m ? Number(m[1]) : null,
      translateY: m ? Number(m[2]) : null,
      cajaAncho: caja.clientWidth,
      cajaAlto: caja.clientHeight,
      imgAnchoPx: img.getBoundingClientRect().width,
      imgAltoPx: img.getBoundingClientRect().height,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
    }
  })
  log("transform de la prenda:", datos)

  // Sonda independiente: detecta la pose UNA VEZ, en una pestaña aparte, con
  // su propia copia de @mediapipe/tasks-vision (no la de la app), para saber
  // dónde están REALMENTE los hombros en pantalla y comparar contra eso, en
  // vez de solo comprobar que el translate() "no sea disparatado".
  const sonda = await medirCentroDelCuerpoIndependiente(browser)
  const HOMBRO_IZQ = 11
  const HOMBRO_DER = 12
  const pIzq = sonda.landmarks[HOMBRO_IZQ]
  const pDer = sonda.landmarks[HOMBRO_DER]
  const cIzq = proyectarComoObjectCover(pIzq, sonda.videoWidth, sonda.videoHeight, datos.cajaAncho, datos.cajaAlto)
  const cDer = proyectarComoObjectCover(pDer, sonda.videoWidth, sonda.videoHeight, datos.cajaAncho, datos.cajaAlto)
  const centroCuerpoX = (cIzq.x + cDer.x) / 2
  const centroCuerpoY = (cIzq.y + cDer.y) / 2

  // El punto que la app ancla al medio de los hombros es el 50%/24% de la
  // imagen de la prenda (ANCLA_ESTANDAR en landmarkMath.ts), no su esquina
  // top-left: hay que leer el mismo punto para comparar manzanas con manzanas.
  const centroPrendaX = datos.translateX + 0.5 * datos.imgAnchoPx
  const centroPrendaY = datos.translateY + 0.24 * datos.imgAltoPx

  const dx = centroPrendaX - centroCuerpoX
  const dy = centroPrendaY - centroCuerpoY
  const separacionPx = Math.hypot(dx, dy)

  // Tolerancia: 18% del ancho del recuadro (pedido: 15-20%). Se aplica a
  // cada eje por separado y no a la distancia euclídea derecha para no ser
  // más laxo en diagonal que en cada eje.
  const TOLERANCIA_POSICION_FRACCION = 0.18
  const toleranciaPx = TOLERANCIA_POSICION_FRACCION * datos.cajaAncho
  const ancladaSobreElCuerpo = Math.abs(dx) <= toleranciaPx && Math.abs(dy) <= toleranciaPx

  log("centro del cuerpo (sonda independiente, proyectado con object-cover):", {
    centroCuerpoX: Math.round(centroCuerpoX),
    centroCuerpoY: Math.round(centroCuerpoY),
  })
  log("centro de la prenda (según su translate()):", {
    centroPrendaX: Math.round(centroPrendaX),
    centroPrendaY: Math.round(centroPrendaY),
  })
  log(`separación: dx=${dx.toFixed(1)}px, dy=${dy.toFixed(1)}px, distancia=${separacionPx.toFixed(1)}px (tolerancia ±${toleranciaPx.toFixed(1)}px = ${TOLERANCIA_POSICION_FRACCION * 100}% del ancho del recuadro)`)
  log(ancladaSobreElCuerpo ? "posición: OK — el centro de la prenda cae cerca del centro real del cuerpo" : "posición: FALLA — la prenda no está sobre el cuerpo")

  // Tamaño: entre el 10% (una prenda visiblemente puesta, no un timbre) y el
  // 100% (una remera no puede ser más ancha que el encuadre de cuerpo entero
  // que pide el paso 2 del panel) del ancho del recuadro. El límite inferior
  // es generoso a propósito: una prenda de torso a metro y medio de la
  // cámara ocupa una fracción chica del cuadro, pero un recorte roto o una
  // escala mal calculada suele irse a un orden de magnitud, no a un 20%.
  const FRACCION_MINIMA_ANCHO = 0.1
  const FRACCION_MAXIMA_ANCHO = 1.0
  const fraccionAncho = datos.imgAnchoPx / datos.cajaAncho
  const tamanioRazonable = fraccionAncho >= FRACCION_MINIMA_ANCHO && fraccionAncho <= FRACCION_MAXIMA_ANCHO
  log(`tamaño: ancho de la prenda = ${fraccionAncho * 100}% del ancho del recuadro (rango aceptado: ${FRACCION_MINIMA_ANCHO * 100}%-${FRACCION_MAXIMA_ANCHO * 100}%)`)
  log(tamanioRazonable ? "tamaño: OK" : "tamaño: FALLA — fuera del rango razonable")

  await page.screenshot({ path: path.join(OUT, "1-camino-feliz.png"), fullPage: true })
  // Recorte de solo la escena (video + prenda), mas facil de mirar a ojo.
  await page.locator(".relative.aspect-\\[3\\/4\\]").first().screenshot({
    path: path.join(OUT, "1-camino-feliz-escena.png"),
  })

  // --- Foto ---------------------------------------------------------------
  // El boton "Sacar foto" no lo tocaba ninguna prueba: ni unitaria (toca
  // canvas) ni de navegador. Se hace clic y se comprueba que la descarga
  // se dispare de verdad, con un archivo de mas de 0 bytes y sin que
  // aparezca el aviso de error.
  const descarga = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    page.locator("button", { hasText: "Sacar foto" }).click(),
  ]).then(([d]) => d)
  const rutaFoto = path.join(OUT, "1-foto-descargada.png")
  await descarga.saveAs(rutaFoto)
  const bytesFoto = fs.statSync(rutaFoto).size
  const avisoTrasLaFoto = await page.evaluate(() =>
    document.body.innerText.includes("No pudimos guardar la foto"),
  )
  log(`foto descargada: ${descarga.suggestedFilename()} (${bytesFoto} bytes) — aviso de error: ${avisoTrasLaFoto}`)

  log("archivos de /mediapipe/ que pidio el navegador:", pedidosMediapipe)

  if (errores.length) log("ERRORES JS:", [...new Set(errores)])
  else log("errores de JS en consola: ninguno")
  if (ruido.length) log(`(ademas, ${ruido.length} lineas de ruido conocido del motor TFLite, ignoradas)`)

  await context.close()
  return {
    opacityOk: datos.opacity === "1",
    ancladaSobreElCuerpo,
    tamanioRazonable,
    dx,
    dy,
    separacionPx,
    fraccionAncho,
    fotoDescargada: descarga.suggestedFilename(),
    bytesFoto,
    avisoTrasLaFoto,
    pedidosMediapipe,
    errores,
  }
}

// --- Escenario 2: sin camara ----------------------------------------------
// La version anterior lanzaba un Chromium SIN las banderas de camara falsa y
// confiaba en que la maquina no tuviera webcam. En cualquier notebook con
// camara ese escenario no se cumple: la prueba se queda esperando la pantalla
// de respaldo y falla a los 20 s. Ahora el rechazo se FUERZA, inyectando un
// getUserMedia que rechaza con el `name` que le importa a `useCamara`
// ("NotFoundError" -> estado "sin-camara"), asi que el resultado no depende
// del hardware de quien corra la prueba.
async function probarSinCamara(browser) {
  log("\n=== Escenario 2: sin camara (getUserMedia forzado a NotFoundError) ===")
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await context.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      writable: true,
      value: () =>
        Promise.reject(new DOMException("Requested device not found", "NotFoundError")),
    })
  })
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

// --- Escenario 4: el panel guiado en un telefono ---------------------------
// El caso de uso principal es el celular (el propio mensaje de error dice
// "Probá desde el celular"). Con el layout viejo la escena iba primero y el
// <aside> con los pasos despues, asi que en vertical los mensajes que guian a
// la clienta quedaban abajo del pliegue, justo mientras se esta ubicando.
// Se comprueba a 390 px (iPhone 14) que el panel y el <video> se vean los dos
// sin desplazar la pagina.
//
// La altura es 664 y no 844 a proposito: 844 es la pantalla ENTERA del
// telefono, pero la barra de direcciones y la de pestanas de Safari/Chrome se
// comen ~180 px, y lo que hay que comprobar es lo que se ve sin desplazar.
// Con 844 la prueba pasaba incluso con el layout viejo (el panel caia en
// y=695..835, adentro por poco); con 664, que es lo que ve una persona de
// verdad, quedaba afuera.
async function probarEnCelular(browser) {
  log("\n=== Escenario 4: panel guiado visible a 390px de ancho ===")
  const context = await browser.newContext({
    viewport: { width: 390, height: 664 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  const errores = []
  const ruido = []
  await instalarCapturaDeErrores(page, errores, ruido)
  await interceptarPrendas(page)

  await page.goto(BASE + "/probador", { waitUntil: "domcontentloaded", timeout: 60000 })
  await page.waitForSelector("video", { timeout: 15000 })
  await fabricarEsperaDePaso(page, 0)

  const medidas = await page.evaluate(() => {
    const panel = document.querySelector("aside ol")
    const mensaje = document.querySelector("aside ol")?.parentElement?.querySelector("p")
    const video = document.querySelector("video")
    const r = (el) => {
      const b = el.getBoundingClientRect()
      return { top: Math.round(b.top), bottom: Math.round(b.bottom), alto: Math.round(b.height) }
    }
    return {
      alto: window.innerHeight,
      anchoDocumento: document.documentElement.scrollWidth,
      anchoVentana: window.innerWidth,
      panel: r(panel),
      mensaje: mensaje ? r(mensaje) : null,
      video: r(video),
    }
  })
  log("medidas a 390x664:", medidas)

  // Los tres pasos y el mensaje tienen que entrar enteros en la primera
  // pantalla, y el video tiene que empezar dentro de ella (no hace falta que
  // entre entero: es 3/4 y el telefono es alto).
  const panelVisible = medidas.panel.bottom <= medidas.alto && medidas.panel.top >= 0
  const mensajeVisible = !!medidas.mensaje && medidas.mensaje.bottom <= medidas.alto
  const videoEmpiezaVisible = medidas.video.top < medidas.alto
  const sinScrollHorizontal = medidas.anchoDocumento <= medidas.anchoVentana

  log("panel entero en pantalla:", panelVisible)
  log("mensaje del panel en pantalla:", mensajeVisible)
  log("el video empieza dentro de la pantalla:", videoEmpiezaVisible)
  log("sin scroll horizontal:", sinScrollHorizontal)

  await page.screenshot({ path: path.join(OUT, "4-celular-390.png") })
  await page.screenshot({ path: path.join(OUT, "4-celular-390-completa.png"), fullPage: true })

  if (errores.length) log("ERRORES JS:", [...new Set(errores)])
  else log("errores de JS en consola: ninguno")

  await context.close()
  return { medidas, panelVisible, mensajeVisible, videoEmpiezaVisible, sinScrollHorizontal, errores }
}

async function verificarQueElSitioEsteArriba() {
  try {
    const res = await fetch(BASE, { method: "GET" })
    if (!res.ok) throw new Error(`respondio ${res.status}`)
  } catch (e) {
    console.error(`No hay nada escuchando en ${BASE} (${String(e).slice(0, 120)}).`)
    console.error("Levantalo primero, desde mirroria-frontend/:")
    console.error("  npm run build && npm run preview -- --port 5178")
    console.error("(o apuntalo a otro lado con BASE=http://localhost:5174)")
    process.exit(1)
  }
}

;(async () => {
  await verificarQueElSitioEsteArriba()
  const prendaObjetivo = await primeraPrendaConRecorte()
  log("prenda de referencia (primera con recorte segun el API):", prendaObjetivo)

  // Un solo navegador: el escenario "sin camara" ya no depende de lanzar
  // Chromium sin las banderas de camara falsa, porque fuerza el rechazo de
  // getUserMedia por su cuenta.
  const browser = await chromium.launch({ args: ARGS_CAMARA_FALSA })

  const resultados = {}
  try {
    resultados.feliz = await probarCaminoFeliz(browser, prendaObjetivo)
    resultados.sinCamara = await probarSinCamara(browser)
    resultados.prendaRota = await probarPrendaQueNoCarga(browser, prendaObjetivo)
    resultados.celular = await probarEnCelular(browser)
  } finally {
    await browser.close()
  }

  log("\n=== Resumen ===")
  log(JSON.stringify(resultados, null, 2))

  const fallo =
    !resultados.feliz.opacityOk ||
    !resultados.feliz.ancladaSobreElCuerpo ||
    !resultados.feliz.tamanioRazonable ||
    resultados.feliz.bytesFoto <= 0 ||
    resultados.feliz.avisoTrasLaFoto ||
    resultados.feliz.errores.length > 0 ||
    !resultados.celular.panelVisible ||
    !resultados.celular.mensajeVisible ||
    !resultados.celular.videoEmpiezaVisible ||
    !resultados.celular.sinScrollHorizontal ||
    resultados.celular.errores.length > 0 ||
    !resultados.sinCamara.hayBotonReintentar ||
    resultados.sinCamara.hayVideo ||
    resultados.sinCamara.errores.length > 0 ||
    !resultados.prendaRota.hayVideoTrasElError ||
    // Exactamente 1: el <img onError> del PNG roto dispara una sola petición
    // de red por intento de carga, no hay lógica de reintento en la app (se
    // vio en las tres corridas de esta prueba). Si algún día un cambio le
    // agrega un reintento legítimo, esto se vuelve `> 1` con un comentario
    // que lo explique — no antes.
    resultados.prendaRota.pedidosFallidos !== 1 ||
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
