import { useEffect, useState } from "react"
import { useSesionEnTienda } from "@/hooks/useSesionEnTienda"
import { useTienda } from "@/hooks/useTienda"
import type { OperacionOutbox } from "@/lib/offline/idb.types"
import { EVENTO_COMPRA_CONFIRMADA } from "@/lib/offline/outbox-manager"
import { formatMoney } from "@/lib/money"
import { useIrAPagar } from "../hooks/useIrAPagar"
import type { MetodoPago } from "../types/payments.types"
import { ElegirPagoDialog } from "./elegir-pago-dialog"

interface CompraConfirmada {
  operacion: OperacionOutbox
  venta: { id?: string; numeroComprobante?: string | null; totalCents?: number } | null
}

/**
 * RN08: sin red no se paga. Cuando un checkout encolado se confirma al
 * sincronizar (la venta nació PENDIENTE), acá se le ofrece pagarlo.
 */
export function AvisoCompraConfirmada() {
  const { slug } = useTienda()
  const clienta = useSesionEnTienda()
  const irAPagar = useIrAPagar()
  const [compra, setCompra] = useState<CompraConfirmada | null>(null)
  const [yendo, setYendo] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      const detalle = (e as CustomEvent<CompraConfirmada>).detail
      if (detalle?.venta?.id && detalle.operacion.tenantId === slug && detalle.operacion.usuarioId === clienta?.id) setCompra(detalle)
    }
    window.addEventListener(EVENTO_COMPRA_CONFIRMADA, handler)
    return () => window.removeEventListener(EVENTO_COMPRA_CONFIRMADA, handler)
  }, [slug, clienta?.id])

  if (!compra?.venta?.id) return null
  const { venta, operacion } = compra
  const total = typeof venta.totalCents === "number" ? ` por ${formatMoney(venta.totalCents)}` : ""

  async function pagar(metodo: MetodoPago) {
    setYendo(true)
    await irAPagar(venta.id as string, metodo)
    setYendo(false)
    setCompra(null)
  }

  return (
    <ElegirPagoDialog
      key={venta.id}
      open
      onOpenChange={(v) => !v && setCompra(null)}
      titulo="Tu compra se confirmó: falta pagarla"
      descripcion={`${venta.numeroComprobante ?? "Pedido"}${total}. La guardaste sin conexión y la tienda ya la registró. Elegí cómo pagar.`}
      textoConfirmar="Pagar ahora"
      metodoInicial={(operacion.meta?.metodoPago as MetodoPago | undefined) ?? "EFECTIVO"}
      isLoading={yendo}
      onConfirmar={pagar}
    />
  )
}
