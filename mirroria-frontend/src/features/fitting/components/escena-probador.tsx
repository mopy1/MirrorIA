import { useEffect, useRef } from "react"
import { ANCLA_ESTANDAR, calcularTransformPrenda, type PuntoPose } from "../lib/landmarkMath"
import { proyeccionCover } from "../lib/proyeccionCover"

interface Props {
  stream: MediaStream | null
  puntos: PuntoPose[]
  par: [number, number]
  urlPrenda: string | null
  /** ¿La pose viene estable (ver `estabilidadDePose`)? Mientras lo sea, un
   * cuadro suelto sin puntos deja la prenda donde estaba en vez de
   * apagarla: es la otra mitad de la histéresis, la que se ve. */
  poseEstable: boolean
  onVideo: (v: HTMLVideoElement | null) => void
  onErrorPrenda: () => void
}

export function EscenaProbador({
  stream,
  puntos,
  par,
  urlPrenda,
  poseEstable,
  onVideo,
  onErrorPrenda,
}: Props) {
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
    // `cont.clientWidth === 0` pasa de verdad: una pestaña oculta, el
    // instante de una rotación de pantalla. Proyectar con un contenedor de
    // ancho 0 da NaN en el transform (y el navegador se come el estilo sin
    // decir nada), así que se trata igual que no tener video.
    if (!img || !cont || !urlPrenda || !v || !v.videoWidth || !v.videoHeight ||
        !cont.clientWidth || !cont.clientHeight) {
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
    if (!t.visible) {
      // Con la pose estable, un cuadro suelto sin los dos puntos no apaga la
      // prenda: se deja donde estaba. Sin esto, la histéresis del panel
      // arreglaba el parpadeo de los pasos pero la prenda seguía
      // prendiéndose y apagándose a 30 fps, que es lo que se ve.
      if (poseEstable) return
      img.style.opacity = "0"
      return
    }
    img.style.opacity = "1"
    img.style.width = `${t.width}px`
    img.style.height = `${t.height}px`
    img.style.transform = `translate(${t.left + proy.offsetX}px, ${t.top + proy.offsetY}px) rotate(${t.rotationDeg}deg)`
  }, [puntos, par, urlPrenda, poseEstable])

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
