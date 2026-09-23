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
        // "sin-camara" agrupa los casos donde no hay permiso que rechazar:
        // no existe cámara (NotFoundError/OverconstrainedError) o existe
        // pero está tomada por otra aplicación (NotReadableError). Decirle
        // "denegada" a alguien a quien nunca se le pidió permiso es peor.
        const sinCamara =
          e.name === "NotFoundError" || e.name === "OverconstrainedError" || e.name === "NotReadableError"
        setEstado(sinCamara ? "sin-camara" : "denegada")
      })
    return () => {
      vivo.current = false
      actual?.getTracks().forEach((t) => t.stop())
    }
  }, [intento])

  return { stream, estado, reintentar }
}
