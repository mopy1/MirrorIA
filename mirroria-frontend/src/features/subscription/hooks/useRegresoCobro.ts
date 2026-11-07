import { useCallback, useEffect, useState } from "react"
import { suscripcionApi } from "../api/suscripcionApi"
import { estadoInicialRegreso, siguienteEstado, type EstadoRegreso } from "../lib/regreso-cobro"

/** Al volver de Stripe o PayPal, confirma el cobro con el backend antes de anunciar nada. */
export function useRegresoCobro(pago: string | null, cobroId: string | null, onPagado: () => void) {
  const [estado, setEstado] = useState<EstadoRegreso | null>(() => estadoInicialRegreso(pago, cobroId))

  const confirmar = useCallback(() => {
    if (pago !== "exito" || !cobroId) return
    setEstado("confirmando")
    suscripcionApi
      .confirmarCobro(cobroId)
      .then((res) => {
        setEstado((actual) => siguienteEstado(actual, res))
        if (res.pagado) onPagado()
      })
      .catch(() => setEstado((actual) => (actual === "pagado" ? actual : "error")))
  }, [pago, cobroId, onPagado])

  useEffect(() => {
    confirmar()
  }, [confirmar])

  return { estado, confirmar }
}
