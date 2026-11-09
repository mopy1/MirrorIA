import { useNavigate } from "react-router-dom"
import { useRutaTienda } from "@/hooks/useRutaTienda"
import { ApiError } from "@/lib/api"
import { paymentsApi } from "../api/paymentsApi"
import type { MetodoPago } from "../types/payments.types"

/**
 * Lleva a pagar una venta ya creada (PENDIENTE): la del checkout, la de
 * "Comprar lo que reservé" o la que se confirmó al sincronizar la outbox.
 * Tarjeta → Stripe; PayPal → PayPal; QR → `/pago/:id?metodo=QR`; efectivo → instrucciones y
 * la cajera confirma en Cobros.
 */
export function useIrAPagar() {
  const ruta = useRutaTienda()
  const navigate = useNavigate()

  return async function irAPagar(ventaId: string, metodo: MetodoPago) {
    if (metodo === "TARJETA" || metodo === "PAYPAL") {
      try {
        const { url } = await (metodo === "PAYPAL" ? paymentsApi.iniciarPaypal(ventaId) : paymentsApi.iniciarTarjeta(ventaId))
        // La pasarela vuelve a una URL fija (sin la venta en la ruta ni en
        // query params) — guardamos de cuál venta se trata para poder
        // consultar su estado real al volver, en vez de confiar en la URL.
        sessionStorage.setItem("mirroria_pago_venta_id", ventaId)
        // "Continuar pago" del carrito tiene que volver a la misma pasarela.
        sessionStorage.setItem(`mirroria_pasarela_${ventaId}`, metodo)
        window.location.href = url
        return
      } catch (err) {
        // El servidor de la demo puede no tener claves de Stripe (503): la
        // venta ya existe, así que se la manda a pagarla en efectivo/QR en vez
        // de dejarla en un callejón sin salida.
        navigate(ruta(`/pago/${ventaId}`), {
          state: { motivo: err instanceof ApiError ? err.message : "No se pudo iniciar el pago en línea" },
        })
        return
      }
    }
    navigate(ruta(`/pago/${ventaId}?metodo=${metodo}`))
  }
}
