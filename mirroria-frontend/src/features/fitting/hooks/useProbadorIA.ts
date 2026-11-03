import { createDecartClient, models, type RealTimeClient } from "@decartai/sdk"
import { useCallback, useEffect, useRef, useState } from "react"
import { ApiError } from "@/lib/api"
import { probadorApi } from "../api/probadorApi"

export type EstadoIA = "inactivo" | "conectando" | "conectado" | "error"

const MODELO = models.realtime("lucy-vton-3.5")

/**
 * Conecta la cámara local con Decart (VTON, RF13) y expone el stream ya
 * vestido por la IA. Un solo `RealTimeClient` por sesión de cámara: cambiar
 * de prenda es un `set()` sobre la conexión existente (`probarPrenda`), no
 * una reconexión — así lo documenta la guía de e-commerce try-on de Decart.
 *
 * El token que arma la conexión es efímero (`probadorApi.obtenerToken`,
 * 5 min): la clave real (`DECART_API_KEY`) nunca sale del backend.
 */
export function useProbadorIA(stream: MediaStream | null) {
  const [remoto, setRemoto] = useState<MediaStream | null>(null)
  const [estado, setEstado] = useState<EstadoIA>("inactivo")
  // Solo el 429 del backend (tope de tokens por IP): ese mensaje le dice a la
  // clienta cuánto esperar; cualquier otro fallo queda en el genérico.
  const [limite, setLimite] = useState<string | null>(null)
  const cliente = useRef<RealTimeClient | null>(null)
  const vivo = useRef(true)

  useEffect(() => {
    vivo.current = true
    setRemoto(null)
    if (!stream) {
      setEstado("inactivo")
      return
    }

    setEstado("conectando")
    setLimite(null)
    probadorApi
      .obtenerToken()
      .then(({ apiKey }) => {
        if (!vivo.current) return null
        const client = createDecartClient({ apiKey })
        return client.realtime.connect(stream, {
          model: MODELO,
          mirror: "auto",
          onRemoteStream: (s) => {
            if (vivo.current) setRemoto(s)
          },
          onConnectionChange: (s) => {
            if (!vivo.current) return
            if (s === "connected" || s === "generating") setEstado("conectado")
            else if (s === "disconnected") setEstado("error")
          },
        })
      })
      .then((rt) => {
        if (!rt) return
        if (!vivo.current) {
          rt.disconnect()
          return
        }
        cliente.current = rt
      })
      .catch((e: unknown) => {
        if (!vivo.current) return
        if (e instanceof ApiError && e.status === 429) setLimite(e.message)
        setEstado("error")
      })

    return () => {
      vivo.current = false
      cliente.current?.disconnect()
      cliente.current = null
    }
  }, [stream])

  // Descarga la foto de referencia y se la manda a la sesión ya conectada.
  // Devuelve `false` (sin lanzar) cuando todavía no hay conexión — la IA
  // puede seguir "conectando" un instante después de que la cámara ya está
  // lista, y la clienta puede haber tocado una prenda en ese hueco.
  const probarPrenda = useCallback(async (imagenUrl: string, prompt: string) => {
    const rt = cliente.current
    if (!rt) return false
    const imagen = await fetch(imagenUrl).then((r) => r.blob())
    await rt.set({ prompt, image: imagen, enhance: false })
    return true
  }, [])

  return { remoto, estado, limite, probarPrenda }
}
