import { useCallback, useEffect, useRef, useState } from "react"
import { ApiError } from "@/lib/api"
import { reportsApi } from "../api/reportsApi"

/** El backend acepta hasta 1 MB: 55 s de opus quedan muy por debajo. */
const MAX_MS = 55_000

/** Primer formato que el navegador sabe grabar (Safari no graba webm). */
function tipoGrabable(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined
  return ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t))
}

/**
 * Respaldo del dictado: graba con el micrófono y el servidor lo transcribe con Gemini.
 * Se usa cuando la Web Speech API del navegador no llega a su servicio (Brave, Opera…).
 */
export function useGrabacionVoz(onTexto: (texto: string) => void) {
  const [grabando, setGrabando] = useState(false)
  const [transcribiendo, setTranscribiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const grabadorRef = useRef<MediaRecorder | null>(null)
  const topeRef = useRef<number | undefined>(undefined)
  const onTextoRef = useRef(onTexto)
  useEffect(() => {
    onTextoRef.current = onTexto
  }, [onTexto])

  const soportada = typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia) && Boolean(tipoGrabable())

  const transcribir = useCallback(async (audio: Blob) => {
    setTranscribiendo(true)
    try {
      const { texto } = await reportsApi.transcribir(audio)
      onTextoRef.current(texto)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo transcribir el audio. Probá de nuevo o escribí la pregunta.")
    } finally {
      setTranscribiendo(false)
    }
  }, [])

  const iniciar = useCallback(async () => {
    if (grabadorRef.current) return
    setError(null)
    let flujo: MediaStream
    try {
      flujo = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError("El navegador no tiene permiso para usar el micrófono.")
      return
    }
    const tipo = tipoGrabable()
    const grabador = new MediaRecorder(flujo, tipo ? { mimeType: tipo } : undefined)
    const partes: Blob[] = []
    grabador.ondataavailable = (e) => {
      if (e.data.size > 0) partes.push(e.data)
    }
    grabador.onstop = () => {
      window.clearTimeout(topeRef.current)
      flujo.getTracks().forEach((t) => t.stop())
      grabadorRef.current = null
      setGrabando(false)
      const audio = new Blob(partes, { type: grabador.mimeType || tipo || "audio/webm" })
      if (audio.size > 0) void transcribir(audio)
    }
    grabadorRef.current = grabador
    grabador.start()
    setGrabando(true)
    topeRef.current = window.setTimeout(() => grabador.state === "recording" && grabador.stop(), MAX_MS)
  }, [transcribir])

  const detener = useCallback(() => {
    const g = grabadorRef.current
    if (g && g.state === "recording") g.stop()
  }, [])

  // Al salir de la pantalla se suelta el micrófono.
  useEffect(() => () => {
    const g = grabadorRef.current
    if (g) {
      g.onstop = null
      if (g.state === "recording") g.stop()
      g.stream.getTracks().forEach((t) => t.stop())
    }
    window.clearTimeout(topeRef.current)
  }, [])

  return { soportada, grabando, transcribiendo, error, iniciar, detener }
}
