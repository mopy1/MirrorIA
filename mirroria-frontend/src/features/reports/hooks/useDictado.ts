import { useEffect, useRef, useState } from "react"

const MENSAJES_ERROR: Record<string, string> = {
  "not-allowed": "El navegador no tiene permiso para usar el micrófono.",
  "no-speech": "No se escuchó nada. Probá hablar más fuerte o más cerca del micrófono.",
  "audio-capture": "No se encontró un micrófono disponible.",
  network: "Falló la conexión necesaria para transcribir (esta API depende de internet).",
  "language-not-supported": "El navegador no soporta el idioma configurado para dictar.",
}

/**
 * Dictado con la Web Speech API del navegador: cero dependencias y la
 * transcripcion ocurre en el cliente, como fija el diseño de BD (el backend
 * recibe texto, nunca audio). Donde la API no exista, `soportado` es false y
 * la pantalla simplemente no muestra el boton.
 *
 * `es-ES` (no `es-419` ni `es-BO`): un tag de idioma regional o generico no
 * siempre esta soportado por el motor de reconocimiento de cada navegador —
 * en Edge concretamente, `es-419` hace fallar la conexion al backend de voz
 * y el sintoma es un error `network` generico (no `language-not-supported`,
 * que seria el error claro). `es-ES` es el mismo tag que ya usa y prueba
 * `case-frontend` (`features/voice/hooks/useSpeechRecognition.ts`) y ahi
 * funciona en el mismo navegador. `interimResults: true` muestra la
 * transcripcion EN VIVO mientras se habla (antes solo se enteraba al final,
 * asi que si algo fallaba a mitad de camino no habia forma de notarlo).
 */
export function useDictado({
  onTextoFinal,
  onTextoParcial,
}: {
  onTextoFinal: (texto: string) => void
  onTextoParcial?: (texto: string) => void
}) {
  const [escuchando, setEscuchando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reconocedorRef = useRef<any>(null)
  // Con `continuous: true` los resultados se van acumulando a lo largo de
  // TODA la sesion (pueden ser varias frases con pausas en el medio) — hay
  // que ir juntando los pedazos ya definitivos (`isFinal`) en vez de
  // quedarse solo con el ultimo, o una pausa a mitad de la pregunta la
  // cortaria en pedazos.
  const acumuladoRef = useRef("")
  // `onTextoFinal`/`onTextoParcial` son closures nuevas en cada render del
  // padre (ReportesAdminPage las define inline). Si el efecto de abajo
  // dependiera de ellas directo, cada resultado parcial dispararia
  // `setPregunta` -> re-render del padre -> nueva closure -> el efecto se
  // desmonta (`r.abort()`) y crea un reconocedor nuevo, abortando la
  // escucha activa a mitad de la frase. Guardarlas en un ref rompe ese
  // ciclo: el efecto que crea el reconocedor solo corre una vez.
  const onTextoFinalRef = useRef(onTextoFinal)
  const onTextoParcialRef = useRef(onTextoParcial)
  useEffect(() => {
    onTextoFinalRef.current = onTextoFinal
    onTextoParcialRef.current = onTextoParcial
  }, [onTextoFinal, onTextoParcial])

  const Reconocedor =
    typeof window !== "undefined"
      ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition)
      : undefined
  const soportado = Boolean(Reconocedor)

  useEffect(() => {
    if (!soportado) return
    const r = new Reconocedor()
    r.lang = "es-ES"
    // `false` cortaba la escucha solo con detectar cualquier pausa/silencio
    // corto (una respiración entre palabras alcanzaba) — con `true` sigue
    // escuchando hasta que se llame `.stop()` explicitamente (el toggle de
    // Espacio/el boton), no por su propia deteccion de silencio.
    r.continuous = true
    r.interimResults = true
    r.onresult = (e: any) => {
      setError(null)
      let interim = ""
      // `e.resultIndex`, no 0: `e.results` trae TODO lo acumulado de la
      // sesion, no solo lo nuevo — arrancar siempre desde 0 reprocesaba (y
      // duplicaba) los resultados `isFinal` de eventos anteriores.
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const resultado = e.results[i]
        const texto = String(resultado[0].transcript)
        if (resultado.isFinal) {
          acumuladoRef.current = `${acumuladoRef.current} ${texto}`.trim()
        } else {
          interim += texto
        }
      }
      onTextoParcialRef.current?.(`${acumuladoRef.current} ${interim}`.trim())
    }
    r.onstart = () => {
      acumuladoRef.current = ""
      // eslint-disable-next-line no-console
      console.log("[dictado] onstart — el navegador empezo a escuchar")
    }
    r.onend = () => {
      // eslint-disable-next-line no-console
      console.log("[dictado] onend, texto final:", acumuladoRef.current)
      setEscuchando(false)
      // Recien acá se manda la pregunta: con `continuous`, una pausa a
      // mitad de la frase ya dispara un resultado `isFinal` — mandarla en
      // ese momento cortaria la pregunta a la mitad.
      if (acumuladoRef.current) onTextoFinalRef.current(acumuladoRef.current)
    }
    r.onerror = (e: { error: string }) => {
      // eslint-disable-next-line no-console
      console.error("[dictado] onerror", e.error)
      setEscuchando(false)
      setError(MENSAJES_ERROR[e.error] ?? `No se pudo dictar (${e.error}).`)
    }
    reconocedorRef.current = r
    return () => {
      r.abort()
    }
  }, [soportado, Reconocedor])

  function iniciar() {
    const r = reconocedorRef.current
    if (!r || escuchando) return
    setError(null)
    r.start()
    setEscuchando(true)
  }

  function detener() {
    const r = reconocedorRef.current
    if (!r || !escuchando) return
    r.stop()
    setEscuchando(false)
  }

  function alternar() {
    if (escuchando) detener()
    else iniciar()
  }

  return { soportado, escuchando, error, alternar, iniciar, detener }
}
