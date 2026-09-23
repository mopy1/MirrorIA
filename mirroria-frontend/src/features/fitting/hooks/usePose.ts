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
  // `activo` se lee dentro del bucle de cada cuadro, no en el efecto: así
  // prender y apagar la cámara no obliga a recrear el detector (que implica
  // recargar el wasm y volver a parsear el .task de 5,5 MB).
  const activoRef = useRef(activo)
  activoRef.current = activo

  useEffect(() => {
    // Sin el <video> montado no hay nada que detectar, y crear el detector
    // igual sale carísimo: baja el wasm (11,7 MB) y parsea el .task (5,8 MB)
    // para tirarlo en el cleanup en cuanto llegue el video —y volver a
    // bajarlo todo—. El guard de `video` estaba DENTRO del bucle de cada
    // cuadro, así que el primer render (con `video` todavía en null) pagaba
    // la carga entera. Con StrictMode, cuatro veces en desarrollo.
    if (!video) return
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
        if (!activoRef.current || video.readyState < 2) return
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
  }, [video])

  return { puntos, listo }
}
