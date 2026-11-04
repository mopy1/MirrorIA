import { useState } from "react"
import { Clock, CreditCard } from "@phosphor-icons/react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { VarianteConProducto } from "@/features/catalog/hooks/useVariantesConProducto"
import type { Venta } from "@/features/checkout/types/checkout.types"
import { paymentsApi } from "@/features/payments/api/paymentsApi"
import { VolverAlCarrito } from "@/features/payments/components/volver-al-carrito"
import { ApiError } from "@/lib/api"
import { formatMoney } from "@/lib/money"

interface CompraPendienteProps {
  venta: Venta
  variantes: VarianteConProducto[]
  onCancelada: () => void
}

/** Compra PENDIENTE de la clienta: el checkout vació el carrito, así que sin
 * este aviso las prendas parecían perdidas. Retomar el pago o deshacerla. */
export function CompraPendiente({ venta, variantes, onCancelada }: CompraPendienteProps) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  async function continuarPago() {
    setIsLoading(true)
    try {
      // Misma ruta que el checkout con tarjeta: el backend reutiliza la sesión
      // de Stripe si sigue abierta.
      const { url } = await paymentsApi.iniciarTarjeta(venta.id)
      sessionStorage.setItem("mirroria_pago_venta_id", venta.id)
      window.location.href = url
    } catch (err) {
      // Sin tarjeta disponible (503) queda el pago en la sucursal.
      navigate(`/pago/${venta.id}`, {
        state: {
          motivo: err instanceof ApiError ? err.message : "No se pudo iniciar el pago con tarjeta",
        },
      })
    }
  }

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2">
          <Clock className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium">
              Tenés una compra pendiente de pago
            </p>
            <p className="text-sm text-muted-foreground">
              Tus prendas quedan apartadas hasta que vence el plazo (30 min con tarjeta o QR, 24 h en efectivo); si no la pagás, se cancela y vuelven a tu carrito.
            </p>
          </div>
        </div>

        <ul className="divide-y divide-border text-sm">
          {venta.items.map((item) => {
            const v = variantes.find((x) => x.varianteId === item.varianteId)
            return (
              <li key={item.id} className="flex justify-between gap-4 py-2">
                <span>
                  {v?.productoTitulo ?? "Prenda"}
                  <span className="text-muted-foreground">
                    {v ? ` · Talla ${v.tallaNombre} · ${v.colorNombre}` : ""} · x{item.cantidad}
                  </span>
                </span>
                <span className="shrink-0">{formatMoney(item.subtotalCents)}</span>
              </li>
            )
          })}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            Total <span className="font-semibold">{formatMoney(venta.totalCents)}</span>
          </p>
          <div className="flex flex-wrap items-start gap-2">
            <VolverAlCarrito ventaId={venta.id} onListo={onCancelada} />
            <Button onClick={continuarPago} disabled={isLoading}>
              <CreditCard data-icon="inline-start" className="size-4" />
              <span>{isLoading ? "Abriendo pago…" : "Continuar pago"}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
