import { Button } from "@/components/ui/button"
import type { DetalleConflictoStock, OperacionOutbox, TipoOperacionOutbox } from "@/lib/offline/idb.types"
import { EVENTO_COMPRA_CONFIRMADA, EVENTO_CONFLICTO_STOCK } from "@/lib/offline/outbox-manager"
import { BadgeEstadoOutbox } from "./badge-estado-outbox"

const TIPOS: Record<TipoOperacionOutbox, string> = {
  CARRITO_AGREGAR: "Agregar al carrito",
  CHECKOUT: "Compra",
  RESERVA_CREAR: "Reserva",
}

const hora = (ms: number) => new Date(ms).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

/** Una operación de la outbox: qué es, su estado (RN09), la clave de idempotencia y qué hacer si terminó. */
export function FilaOutbox({ op, onAccion }: { op: OperacionOutbox; onAccion: () => void }) {
  const ventaId = op.tipo === "CHECKOUT" && op.estado === "CONFIRMADA" ? (op.respuesta?.id as string | undefined) : undefined
  const comprobante = op.respuesta?.numeroComprobante as string | undefined

  function reabrir(tipo: string, detail: unknown) {
    window.dispatchEvent(new CustomEvent(tipo, { detail }))
    onAccion()
  }

  return (
    <div className="flex flex-col gap-1.5 py-3 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{TIPOS[op.tipo] ?? op.tipo}</p>
          <p className="truncate text-sm font-medium text-foreground">{op.descripcion}</p>
        </div>
        <BadgeEstadoOutbox estado={op.estado} className="shrink-0" />
      </div>
      <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
        <span title={op.idempotencyKey}>Idempotency-Key {op.idempotencyKey.slice(0, 8)}</span>
        <span>
          {hora(op.creadoEn)}
          {op.codigoRespuesta ? ` · HTTP ${op.codigoRespuesta}` : ""}
          {op.reintentos > 0 ? ` · ${op.reintentos} reintento(s)` : ""}
        </span>
      </div>
      {op.error && <p className="text-[11px] text-destructive">{op.error}</p>}
      {ventaId && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400">{comprobante ?? "Venta creada"} · falta pagar</span>
          <Button size="sm" className="h-7 text-xs" onClick={() => reabrir(EVENTO_COMPRA_CONFIRMADA, { operacion: op, venta: op.respuesta })}>
            Pagar ahora
          </Button>
        </div>
      )}
      {op.estado === "COMPENSADA" && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 self-start text-xs"
          onClick={() => reabrir(EVENTO_CONFLICTO_STOCK, { detalle: (op.respuesta?.detalles ?? {}) as DetalleConflictoStock, operacion: op })}
        >
          Ver alternativas
        </Button>
      )}
    </div>
  )
}
