import { Camera } from "@phosphor-icons/react"
import { useCallback, useEffect, useRef, useState } from "react"
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

export function ProbadorPage() {
  const { productoId } = useParams()
  const { productos } = useProductos()
  const { categorias } = useCategorias()
  const { stream, estado, reintentar } = useCamara()
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const { puntos } = usePose(video, estado === "lista")
  const [prenda, setPrenda] = useState<Producto | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const enlaceDescarga = useRef<HTMLAnchorElement>(null)

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
    setAviso("Esa prenda no se pudo cargar. Probá con otra.")
    setPrenda(null)
  }, [])

  const alElegirPrenda = useCallback((p: Producto) => {
    setAviso(null)
    setPrenda(p)
  }, [])

  // Dibuja el cuadro actual del video (espejado, igual que se lo ve en
  // pantalla) más la prenda puesta, con la misma cuenta que usa la escena
  // en vivo, y dispara la descarga. Es una foto del cuadro congelado, no un
  // clon 1:1 del <video> con object-cover: se estira al tamaño del recuadro
  // en vez de recortarlo, una simplificación razonable para un recuerdo de
  // probador.
  const sacarFoto = useCallback(() => {
    if (!video) return
    const ancho = video.clientWidth
    const alto = video.clientHeight
    const canvas = document.createElement("canvas")
    canvas.width = ancho
    canvas.height = alto
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.save()
    ctx.translate(ancho, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, ancho, alto)
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

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const t = calcularTransformPrenda(
        puntos[par[0]], puntos[par[1]],
        ancho, alto,
        true,
        img.naturalWidth || 1, img.naturalHeight || 1,
        ANCLA_ESTANDAR,
      )
      if (t.visible) {
        ctx.save()
        ctx.translate(t.left + t.width / 2, t.top + t.height / 2)
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
          <TiraDePrendas prendas={probables} elegidaId={prenda?.id ?? null} onElegir={alElegirPrenda} />
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
