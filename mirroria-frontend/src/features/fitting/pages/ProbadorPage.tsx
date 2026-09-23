import { Camera } from "@phosphor-icons/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import { useCategorias } from "@/features/catalog/hooks/useCategorias"
import { useProductos } from "@/features/catalog/hooks/useProductos"
import type { Producto } from "@/features/catalog/types/catalog.types"
import { EscenaProbador } from "../components/escena-probador"
import { PanelGuiado } from "../components/panel-guiado"
import { RespaldoSinCamara } from "../components/respaldo-sin-camara"
import { TiraDePrendas } from "../components/tira-de-prendas"
import { useCamara } from "../hooks/useCamara"
import { usePose } from "../hooks/usePose"
import { type ResultadoFoto, avisoDespuesDeLaFoto } from "../lib/avisoDeFoto"
import { ESTABILIDAD_INICIAL, siguienteEstabilidad } from "../lib/estabilidadDePose"
import { ANCLA_ESTANDAR, VISIBILIDAD_MINIMA, calcularTransformPrenda } from "../lib/landmarkMath"
import { parDeAnclaje } from "../lib/parDeAnclaje"
import { calcularPasos } from "../lib/pasosGuiados"
import {
  debeAplicarPrendaDelEnlace,
  elegirPrendaInicial,
  prendasProbables,
} from "../lib/prendasProbables"
import { proyeccionCover } from "../lib/proyeccionCover"
import { recorteCover } from "../lib/recorteCover"

/** Cuánto se espera antes de liberar la URL del blob de la foto. Tiene que
 * alcanzar para que el navegador arranque la descarga. */
const MS_PARA_LIBERAR_LA_FOTO = 30_000

export function ProbadorPage() {
  const { productoId } = useParams()
  const { productos } = useProductos()
  const { categorias } = useCategorias()
  const { stream, estado, reintentar } = useCamara()
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const { puntos, listo: modeloListo } = usePose(video, estado === "lista")
  const [prenda, setPrenda] = useState<Producto | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  // Ids cuyo recorte ya dio error en esta sesión: sin esto, si la prenda del
  // enlace no carga, el efecto de abajo la volvería a elegir —siempre la
  // misma, rota— en un bucle sin salida.
  const [fallidas, setFallidas] = useState<ReadonlySet<string>>(() => new Set())
  const enlaceDescarga = useRef<HTMLAnchorElement>(null)

  // Memoizado: sin esto se volvía a filtrar el catálogo entero en cada uno
  // de los ~30 renders por segundo que dispara `usePose`.
  const probables = useMemo(() => prendasProbables(productos), [productos])

  // La prenda del enlace se aplica UNA sola vez por enlace. La condición
  // anterior era «si no hay prenda puesta», y eso se volvía a cumplir cada
  // vez que una prenda se soltaba por un PNG roto: la clienta veía el cartel
  // rojo de error y, al mismo tiempo, la prenda del enlace puesta otra vez
  // (ver `debeAplicarPrendaDelEnlace`).
  const enlaceAplicado = useRef<string | null>(null)
  useEffect(() => {
    if (!debeAplicarPrendaDelEnlace(enlaceAplicado.current, productoId, productos.length > 0)) {
      return
    }
    enlaceAplicado.current = productoId ?? ""
    const inicial = elegirPrendaInicial(productos, productoId, fallidas)
    if (inicial) setPrenda(inicial)
  }, [productos, productoId, fallidas])

  const slug = categorias.find((c) => c.id === prenda?.categoriaId)?.slug ?? ""
  const par = parDeAnclaje(slug)
  const visibles = par.filter((i) => (puntos[i]?.visibility ?? 0) >= VISIBILIDAD_MINIMA).length
  const veLosDosPuntos = visibles === 2

  // Histéresis: el diseño dice «cuando el detector ve los dos hombros por
  // encima del umbral durante un segundo seguido», y la primera versión
  // miraba el cuadro actual y nada más. Con la visibilidad oscilando
  // alrededor del umbral (luz mala, media vuelta, ropa oscura) el paso 2 y
  // la prenda parpadeaban a 30 fps. El efecto corre una vez por cuadro
  // porque `puntos` cambia de identidad en cada cuadro; `siguienteEstabilidad`
  // devuelve el mismo objeto cuando no hay nada que cambiar, así que esto no
  // agrega un render por cuadro.
  const [estabilidad, setEstabilidad] = useState(ESTABILIDAD_INICIAL)
  useEffect(() => {
    setEstabilidad((previo) => siguienteEstabilidad(previo, veLosDosPuntos, performance.now()))
  }, [puntos, veLosDosPuntos])

  const pasos = calcularPasos({
    hayCamara: estado === "lista",
    modeloListo,
    // Mientras la pose se está asentando se informa «te veo a medias», que
    // es justo lo que hay que hacer (ponerse de frente), y no se marca el
    // paso 2 hasta que aguantó el segundo entero.
    puntosVisibles: estabilidad.estable ? 2 : Math.min(visibles, 1),
    prendaElegida: Boolean(prenda),
  })

  // Review Focus 3: si el PNG no carga se suelta la prenda y se avisa, pero la
  // escena y el bucle de render siguen vivos.
  //
  // El id se marca como fallido ANTES de soltar la prenda. `prenda` va en
  // las dependencias a propósito —se lee directo, sin updater funcional
  // dentro de otro updater— para no tener un efecto lateral (`setFallidas`)
  // escondido dentro de la forma funcional de `setPrenda`, que React en modo
  // estricto invoca dos veces para detectar justamente eso. No hace falta
  // que sea estable: solo la usa el <img onError> de la escena, que no está
  // memoizada.
  const alFallarLaPrenda = useCallback(() => {
    setAviso("Esa prenda no se pudo cargar. Probá con otra.")
    if (prenda) setFallidas((prev) => new Set(prev).add(prenda.id))
    setPrenda(null)
  }, [prenda])

  const alElegirPrenda = useCallback((p: Producto) => {
    setAviso(null)
    setPrenda(p)
  }, [])

  // Dibuja el cuadro actual del video (espejado y recortado igual que
  // `object-cover` en pantalla, con `recorteCover`) más la prenda puesta,
  // con la misma cuenta que usa la escena en vivo, y dispara la descarga.
  const sacarFoto = useCallback(() => {
    const avisar = (resultado: ResultadoFoto) =>
      setAviso((previo) => avisoDespuesDeLaFoto(previo, resultado))

    // Sin las dimensiones reales de la cámara no hay ni recorte ni
    // proyección posibles todavía (metadatos sin cargar). Antes el botón se
    // quedaba sin hacer nada, en silencio.
    if (!video || !video.videoWidth || !video.videoHeight) {
      avisar("camara-no-lista")
      return
    }
    const ancho = video.clientWidth
    const alto = video.clientHeight
    const canvas = document.createElement("canvas")
    canvas.width = ancho
    canvas.height = alto
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      avisar("fallo")
      return
    }

    const { sx, sy, sw, sh } = recorteCover(video.videoWidth, video.videoHeight, ancho, alto)
    ctx.save()
    ctx.translate(ancho, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, ancho, alto)
    ctx.restore()

    // `toBlob` + `createObjectURL` en vez de `toDataURL`: un PNG de varios
    // MB metido entero en una data URI es justo donde Safari/iOS falla, y
    // ese es el navegador del caso de uso principal. Además, si el canvas
    // quedara contaminado, `toBlob` lanza `SecurityError`: antes eso dejaba
    // el botón sin hacer nada y sin decir por qué.
    const guardar = (resultado: ResultadoFoto) => {
      const enlace = enlaceDescarga.current
      if (!enlace) {
        avisar("fallo")
        return
      }
      try {
        canvas.toBlob((blob) => {
          if (!blob) {
            avisar("fallo")
            return
          }
          const url = URL.createObjectURL(blob)
          enlace.href = url
          enlace.click()
          // Liberar la URL en el mismo tick puede cancelar la descarga que
          // recién arranca; un rato después ya no.
          setTimeout(() => URL.revokeObjectURL(url), MS_PARA_LIBERAR_LA_FOTO)
          avisar(resultado)
        }, "image/png")
      } catch {
        avisar("fallo")
      }
    }

    if (!prenda?.arOverlayImageUrl) {
      guardar("ok")
      return
    }

    // Mismo problema espejado que en la escena en vivo: los landmarks son
    // fracciones del cuadro completo de la cámara, no del recuadro que
    // `recorteCover` ya recortó arriba. Se proyecta con la misma cuenta para
    // que la prenda caiga en el mismo lugar que se vio en pantalla.
    const proy = proyeccionCover(video.videoWidth, video.videoHeight, ancho, alto)
    const img = new Image()
    // Sin esto el canvas quedaría contaminado (las URL de las prendas son
    // absolutas a otro dominio) y no se podría guardar nada. El costo es que
    // si ese dominio no manda `Access-Control-Allow-Origin`, la imagen no
    // carga y la foto sale sin prenda: eso ahora se AVISA (antes pasaba en
    // silencio, y en desarrollo pasa siempre).
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const t = calcularTransformPrenda(
        puntos[par[0]], puntos[par[1]],
        proy.anchoMostrado, proy.altoMostrado,
        true,
        img.naturalWidth || 1, img.naturalHeight || 1,
        ANCLA_ESTANDAR,
      )
      if (t.visible) {
        ctx.save()
        ctx.translate(t.left + proy.offsetX + t.width / 2, t.top + proy.offsetY + t.height / 2)
        ctx.rotate((t.rotationDeg * Math.PI) / 180)
        ctx.drawImage(img, -t.width / 2, -t.height / 2, t.width, t.height)
        ctx.restore()
      }
      guardar(t.visible ? "ok" : "sin-prenda")
    }
    img.onerror = () => guardar("sin-prenda")
    img.src = prenda.arOverlayImageUrl
  }, [video, prenda, puntos, par])

  return (
    /* El orden del DOM es el del CELULAR, que es el caso de uso principal
       (el propio mensaje de error dice "Probá desde el celular"): primero
       los pasos que guían a la clienta, después la cámara y la tira, y al
       final los botones. Antes la escena iba primero y el <aside> entero
       después, así que en vertical los mensajes ("acercate", "ponete de
       frente") quedaban abajo del pliegue justo mientras se está ubicando.
       En pantallas grandes las tres piezas se recolocan con las clases
       `lg:col-start-*` / `lg:row-start-*`: la escena a la izquierda
       ocupando las dos filas, y a la derecha el panel arriba y los botones
       abajo, igual que antes. */
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_20rem] lg:grid-rows-[auto_1fr]">
      <aside className="flex flex-col gap-4 lg:col-start-2 lg:row-start-1">
        <h1 className="text-2xl font-semibold tracking-tight">Probador virtual</h1>
        <PanelGuiado pasos={pasos} />
        {aviso && <p className="text-sm text-destructive">{aviso}</p>}
      </aside>

      {/* min-w-0: por defecto un item de grid no baja de su contenido
          mínimo, y el <video> de la escena reporta su ancho intrínseco (el
          de la cámara, típicamente 1280px) a esa cuenta aunque tenga
          width:100%. Sin esto, esta columna empujaba el documento entero y
          aparecía scroll horizontal con la cámara activa. */}
      <div className="min-w-0 lg:col-start-1 lg:row-start-1 lg:row-span-2">
        {estado === "lista" ? (
          <EscenaProbador
            stream={stream}
            puntos={puntos}
            par={par}
            urlPrenda={prenda?.arOverlayImageUrl ?? null}
            poseEstable={estabilidad.estable}
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
          <TiraDePrendas
            prendas={probables}
            elegidaId={prenda?.id ?? null}
            fallidas={fallidas}
            onElegir={alElegirPrenda}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:col-start-2 lg:row-start-2 lg:self-start">
        {estado === "lista" && (
          <button type="button" onClick={sacarFoto} className={cn(buttonVariants({ variant: "outline" }))}>
            <Camera />
            Sacar foto
          </button>
        )}
        {prenda && (
          <Link to={`/tienda/producto/${prenda.id}`} className={cn(buttonVariants())}>
            Reservar en sucursal
          </Link>
        )}

        {/* Ancla oculta: acá cae la descarga de la foto que arma `sacarFoto`. */}
        <a ref={enlaceDescarga} download="probador-mirroria.png" className="hidden">
          descarga
        </a>
      </div>
    </div>
  )
}
