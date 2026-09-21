import { useEffect, useRef, useState } from "react"

/**
 * Dictado con la Web Speech API del navegador: cero dependencias y la
 * transcripcion ocurre en el cliente, como fija el diseño de BD (el backend
 * recibe texto, nunca audio). Donde la API no exista, `soportado` es false y
 * la pantalla simplemente no muestra el boton.
 */
export function useDictado({ onTexto }: { onTexto: (texto: string) => void }) {
  const [escuchando, setEscuchando] = useState(false)
  const reconocedorRef = useRef<any>(null)

  const Reconocedor =
    typeof window !== "undefined"
      ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition)
      : undefined
  const soportado = Boolean(Reconocedor)

  useEffect(() => {
    if (!soportado) return
    const r = new Reconocedor()
    r.lang = "es-BO"
    r.continuous = false
    r.interimResults = false
    r.onresult = (e: any) => onTexto(String(e.results[0][0].transcript))
    r.onend = () => setEscuchando(false)
    r.onerror = () => setEscuchando(false)
    reconocedorRef.current = r
    return () => {
      r.abort()
    }
  }, [soportado, Reconocedor, onTexto])

  function alternar() {
    const r = reconocedorRef.current
    if (!r) return
    if (escuchando) {
      r.stop()
      setEscuchando(false)
    } else {
      r.start()
      setEscuchando(true)
    }
  }

  return { soportado, escuchando, alternar }
}
