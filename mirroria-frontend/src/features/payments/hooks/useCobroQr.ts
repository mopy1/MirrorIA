import { useEffect, useRef, useState } from "react"
import { ApiError } from "@/lib/api"
import { paymentsApi } from "../api/paymentsApi"
import type { CobroQr, EstadoCobroQrRespuesta } from "../types/payments.types"

/** Cada cuánto se pregunta si ya pagaron. Lo bastante corto para que el cambio
 * se sienta instantáneo en la defensa, lo bastante largo para no martillar. */
const INTERVALO_MS = 2500

/**
 * Genera el QR de la compra y queda consultando su estado hasta que el banco
 * avisa que se pagó (o que la compra venció). La pantalla no confirma nada por
 * su cuenta: solo refleja lo que el backend ya acreditó.
 */
export function useCobroQr(ventaId: string | undefined) {
  const [cobro, setCobro] = useState<CobroQr | null>(null)
  const [estado, setEstado] = useState<EstadoCobroQrRespuesta | null>(null)
  const [error, setError] = useState<string | null>(null)
  const solicitado = useRef<string | null>(null)

  useEffect(() => {
    if (!ventaId || solicitado.current === ventaId) return
    solicitado.current = ventaId
    paymentsApi
      .iniciarQr(ventaId)
      .then(setCobro)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "No se pudo generar el QR de pago")
      )
  }, [ventaId])

  const terminado = estado !== null && estado.estado !== "PENDIENTE"

  useEffect(() => {
    if (!cobro || terminado) return
    let activo = true
    const consultar = () =>
      paymentsApi
        .estadoQr(cobro.pagoId)
        .then((e) => activo && setEstado(e))
        // Un fallo de red suelto no es motivo para tirar la pantalla: el
        // próximo intento lo vuelve a preguntar.
        .catch(() => undefined)
    const id = window.setInterval(consultar, INTERVALO_MS)
    return () => {
      activo = false
      window.clearInterval(id)
    }
  }, [cobro, terminado])

  return {
    cobro,
    estado: estado?.estado ?? cobro?.estado ?? null,
    transaccion: estado?.transaccion ?? null,
    pagadoEn: estado?.pagadoEn ?? null,
    error,
    isLoading: !cobro && !error,
  }
}
