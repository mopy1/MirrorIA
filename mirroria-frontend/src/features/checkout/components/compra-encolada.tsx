import { useEffect } from "react"
import { ClockCountdown } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { BadgeEstadoOutbox } from "@/components/common/badge-estado-outbox"
import { Button, buttonVariants } from "@/components/ui/button"
import { useRutaTienda } from "@/hooks/useRutaTienda"
import type { OperacionOutbox } from "@/lib/offline/idb.types"
import { EVENTO_COMPRA_CONFIRMADA } from "@/lib/offline/outbox-manager"
import { abrirOutbox, useOutbox } from "@/lib/offline/use-outbox"
import { cn } from "cn"

const TEXTOS: Record<OperacionOutbox["estado"], string> = {
  PENDIENTE: "Se envía solo cuando vuelva la red; si la prenda sigue disponible te avisamos para que la pagues. No se te cobró nada.",
  ENVIANDO: "Volvió la conexión: lo estamos enviando a la tienda.",
  CONFIRMADA: "La tienda registró tu pedido. Falta pagarlo: hasta entonces no es una compra cerrada.",
  COMPENSADA: "Otra clienta se llevó la última unidad antes de que llegara tu pedido. Se anuló sin cobrarte nada.",
  RECHAZADA: "La tienda no pudo registrar el pedido. No se te cobró nada.",
}

/**
 * Comprobante del checkout hecho sin red (RN09): "Pendiente de confirmar",
 * nunca "comprado", y se actualiza en vivo con la outbox. El pago se ofrece
 * recién cuando el servidor confirma la venta (RN08).
 */
export function CompraEncolada({ operacion }: { operacion: OperacionOutbox }) {
  const ruta = useRutaTienda()
  const { operaciones } = useOutbox({ tenantId: operacion.tenantId, usuarioId: operacion.usuarioId })
  const op = operaciones.find((o) => o.id === operacion.id) ?? operacion
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  const pagar = () => window.dispatchEvent(new CustomEvent(EVENTO_COMPRA_CONFIRMADA, { detail: { operacion: op, venta: op.respuesta } }))

  return (
    <div className="space-y-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
      <div className="flex items-start gap-3">
        <ClockCountdown className="size-6 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="space-y-1.5">
          <BadgeEstadoOutbox estado={op.estado} />
          <h2 className="text-lg font-semibold text-foreground">Guardamos tu pedido sin conexión</h2>
          <p className="text-sm text-muted-foreground">
            {op.descripcion}. {TEXTOS[op.estado]}
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Clave de la operación: <span className="font-mono">{op.idempotencyKey.slice(0, 8)}</span> (se reutiliza en cada
        reintento, así nunca se compra dos veces).
      </p>
      <div className="flex flex-wrap gap-2">
        {op.estado === "CONFIRMADA" ? <Button onClick={pagar}>Pagar ahora</Button> : <Button onClick={abrirOutbox}>Ver pendientes</Button>}
        <Link to={ruta("/tienda")} className={cn(buttonVariants({ variant: "outline" }))}>
          Seguir mirando
        </Link>
      </div>
    </div>
  )
}
