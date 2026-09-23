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
import { ANCLA_ESTANDAR, VISIBILIDAD_MINIMA, calcularTransformPrenda } from "../lib/landmarkMath"
import { parDeAnclaje } from "../lib/parDeAnclaje"
import { calcularPasos } from "../lib/pasosGuiados"
import { elegirPrendaInicial, prendasProbables } from "../lib/prendasProbables"
import { proyeccionCover } from "../lib/proyeccionCover"
import { recorteCover } from "../lib/recorteCover"

export function ProbadorPage() {
  const { productoId } = useParams()
  const { productos } = useProductos()
  const { categorias } = useCategorias()
  const { stream, estado, reintentar } = useCamara()
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const { puntos } = usePose(video, estado === "lista")
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

  // La prenda del enlace se aplica una sola vez, cuando el catalogo llego
  // (o cuando falla una y hay que reevaluar sin ella).
  useEffect(() => {
    if (!prenda && productos.length) setPrenda(elegirPrendaInicial(productos, productoId, fallidas))
  }, [productos, productoId, prenda, fallidas])

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
    // Sin las dimensiones reales de la cámara no hay ni recorte ni
    // proyección posibles todavía (metadatos sin cargar).
    if (!video || !video.videoWidth || !video.videoHeight) return
    const ancho = video.clientWidth
    const alto = video.clientHeight
    const canvas = document.createElement("canvas")
    canvas.width = ancho
    canvas.height = alto
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { sx, sy, sw, sh } = recorteCover(video.videoWidth, video.videoHeight, ancho, alto)
    ctx.save()
    ctx.translate(ancho, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, ancho, alto)
    ctx.restore()

    const descargar = () => {
      const enlace = enlaceDescarga.current
      if (!enlace) return
      enlace.href = canvas.toDataURL("image/png")
      enlace.click()
    }

    if (!prenda?.arOverlayImageUrl) {
      descargar()
      return
    }

    // Mismo problema espejado que en la escena en vivo: los landmarks son
    // fracciones del cuadro completo de la cámara, no del recuadro que
    // `recorteCover` ya recortó arriba. Se proyecta con la misma cuenta para
    // que la prenda caiga en el mismo lugar que se vio en pantalla.
    const proy = proyeccionCover(video.videoWidth, video.videoHeight, ancho, alto)
    const img = new Image()
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
      descargar()
    }
    // Si el recorte falla acá (más raro: ya se estaba mostrando), la foto
    // sale igual, solo que sin la prenda encima.
    img.onerror = descargar
    img.src = prenda.arOverlayImageUrl
  }, [video, prenda, puntos, par])

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_20rem]">
      {/* min-w-0: por defecto un item de grid no baja de su contenido
          mínimo, y el <video> de la escena reporta su ancho intrínseco (el
          de la cámara, típicamente 1280px) a esa cuenta aunque tenga
          width:100%. Sin esto, esta columna empujaba el documento entero y
          aparecía scroll horizontal con la cámara activa. */}
      <div className="min-w-0">
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
          <TiraDePrendas
            prendas={probables}
            elegidaId={prenda?.id ?? null}
            fallidas={fallidas}
            onElegir={alElegirPrenda}
          />
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Probador virtual</h1>
        <PanelGuiado pasos={pasos} />
        {aviso && <p className="text-sm text-destructive">{aviso}</p>}

        <div className="flex flex-col gap-3">
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
        </div>

        {/* Ancla oculta: acá cae la descarga de la foto que arma `sacarFoto`. */}
        <a ref={enlaceDescarga} download="probador-mirroria.png" className="hidden">
          descarga
        </a>
      </aside>
    </div>
  )
}
