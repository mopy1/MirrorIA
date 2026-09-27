import { useEffect, useRef } from "react"

interface Props {
  /** Cámara cruda, mientras la IA todavía no contestó. */
  stream: MediaStream | null
  /** Stream ya editado por Decart (la prenda puesta) — reemplaza al crudo
   * en cuanto llega. */
  remoto: MediaStream | null
  onVideo: (v: HTMLVideoElement | null) => void
}

export function EscenaProbador({ stream, remoto, onVideo }: Props) {
  const video = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = video.current
    if (!v) return
    v.srcObject = remoto ?? stream
    onVideo(v)
  }, [stream, remoto, onVideo])

  return (
    <div className="relative aspect-[3/4] w-full min-w-0 overflow-hidden rounded-2xl bg-secondary">
      <video
        ref={video}
        autoPlay
        playsInline
        muted
        // El crudo de la cámara se espeja en pantalla (efecto espejo real).
        // El stream de Decart ya viene espejado (`mirror: "auto"` en
        // `useProbadorIA`) — espejarlo otra vez lo dejaría al revés.
        className={`h-full w-full object-cover ${remoto ? "" : "scale-x-[-1]"}`}
      />
    </div>
  )
}
