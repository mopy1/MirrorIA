import { useEffect, useState } from "react"
import { ApiError } from "@/lib/api"
import { wayraApi } from "../api/wayraApi"
import type { CobroWayra, ComprobanteWayra } from "../types/wayra.types"

export type PasoWayra = "cargando" | "no-encontrado" | "cobro" | "pin" | "procesando" | "comprobante"

/**
 * El recorrido de la app del banco al escanear un QR: ver el cobro, elegir la
 * cuenta, poner el PIN y recibir el comprobante. El backend decide si se puede
 * pagar; esta pantalla solo acompaña los pasos.
 */
export function useWayraPago(token: string | undefined) {
  const [paso, setPaso] = useState<PasoWayra>(token ? "cargando" : "no-encontrado")
  const [cobro, setCobro] = useState<CobroWayra | null>(null)
  const [cuentaId, setCuentaId] = useState<string | null>(null)
  const [comprobante, setComprobante] = useState<ComprobanteWayra | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    wayraApi
      .verCobro(token)
      .then((c) => {
        setCobro(c)
        setCuentaId(c.cuentas[0]?.id ?? null)
        setPaso("cobro")
      })
      .catch(() => setPaso("no-encontrado"))
  }, [token])

  function continuar() {
    if (!cuentaId) return
    setError(null)
    setPaso("pin")
  }

  async function confirmarPin(pin: string) {
    if (!token || !cuentaId) return
    setPaso("procesando")
    setError(null)
    try {
      setComprobante(await wayraApi.pagar(token, cuentaId, pin))
      setPaso("comprobante")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo completar el pago. Intentá de nuevo.")
      // Si el QR dejó de ser pagable (lo pagaron desde otro celular, venció),
      // se recarga para mostrar el estado real en vez de dejar el botón vivo.
      const actualizado = await wayraApi.verCobro(token).catch(() => null)
      if (actualizado) setCobro(actualizado)
      setPaso("cobro")
    }
  }

  return {
    paso,
    cobro,
    cuentaId,
    setCuentaId,
    comprobante,
    error,
    continuar,
    volver: () => setPaso("cobro"),
    // "Listo" en el comprobante: se vuelve a leer el QR, que ahora figura pagado.
    terminar: async () => {
      if (!token) return
      const actualizado = await wayraApi.verCobro(token).catch(() => null)
      if (actualizado) setCobro(actualizado)
      setPaso("cobro")
    },
    confirmarPin,
  }
}
