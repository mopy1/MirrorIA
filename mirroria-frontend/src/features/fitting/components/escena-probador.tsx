import { useEffect, useRef } from "react"
import { ANCLA_ESTANDAR, calcularTransformPrenda, type PuntoPose } from "../lib/landmarkMath"
import { proyeccionCover } from "../lib/proyeccionCover"

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
    const v = video.current
    // Sin las dos dimensiones del video (llegan recién con los metadatos
    // cargados) no hay proyección posible: mejor ocultar que anclar mal.
    if (!img || !cont || !urlPrenda || !v || !v.videoWidth || !v.videoHeight) {
      if (img) img.style.opacity = "0"
      return
    }
    // Los landmarks son fracciones del cuadro COMPLETO de la cámara, pero
    // `object-cover` recorta ese cuadro para tapar el recuadro (que casi
    // nunca comparte su relación de aspecto: cámara horizontal, escena
    // vertical). Sin esta proyección, `calcularTransformPrenda` recibía el
    // tamaño del recuadro VISIBLE como si fuera el del video entero, y la
    // prenda quedaba desplazada y con la escala mal (Review Focus: la
    // prenda flotaba al costado del cuerpo en vez de apoyarse encima).
    const proy = proyeccionCover(v.videoWidth, v.videoHeight, cont.clientWidth, cont.clientHeight)
    const t = calcularTransformPrenda(
      puntos[par[0]], puntos[par[1]],
      proy.anchoMostrado, proy.altoMostrado,
      true,
      img.naturalWidth || 1, img.naturalHeight || 1,
      ANCLA_ESTANDAR,
    )
    img.style.opacity = t.visible ? "1" : "0"
    if (!t.visible) return
    img.style.width = `${t.width}px`
    img.style.height = `${t.height}px`
    img.style.transform = `translate(${t.left + proy.offsetX}px, ${t.top + proy.offsetY}px) rotate(${t.rotationDeg}deg)`
  }, [puntos, par, urlPrenda])

  return (
    <div ref={caja} className="relative aspect-[3/4] w-full min-w-0 overflow-hidden rounded-2xl bg-secondary">
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
