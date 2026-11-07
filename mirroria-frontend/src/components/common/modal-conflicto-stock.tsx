import { useCallback, useState } from "react"
import { CircleNotch, WarningOctagon } from "@phosphor-icons/react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ConflictoStockEvento } from "@/lib/offline/idb.types"
import { encolarCheckout } from "@/lib/offline/operaciones-clienta"
import { useConflictoStockListener } from "@/lib/offline/use-outbox"
import { AlternativasConflicto } from "./alternativas-conflicto"

/**
 * Transacción compensatoria del conflicto `stock = 1` (CU11): la compra encolada
 * chocó al sincronizar (409 STOCK_AGOTADO_CONFLICTO) y quedó COMPENSADA. El
 * checkout entero se anuló en el servidor y el carrito sigue con sus prendas,
 * así que se puede reintentar en otra sucursal (operación nueva, clave nueva).
 */
export function ModalConflictoStock() {
  const navigate = useNavigate()
  const [evento, setEvento] = useState<ConflictoStockEvento | null>(null)
  const [enviando, setEnviando] = useState(false)
  useConflictoStockListener(useCallback((e: ConflictoStockEvento) => setEvento(e), []))

  const detalle = evento?.detalle
  const op = evento?.operacion
  const otra = detalle?.alternativas?.otrasSucursales?.[0]
  const prenda = [detalle?.prendaNombre ?? "prenda", detalle?.talla].filter(Boolean).join(" talla ")
  const cerrar = () => setEvento(null)

  async function retirarEnOtra() {
    if (!op || !otra) return
    setEnviando(true)
    try {
      await encolarCheckout({
        tenantId: op.tenantId,
        usuarioId: op.usuarioId,
        sucursalId: otra.sucursalId,
        metodoPago: String(op.meta?.metodoPago ?? "EFECTIVO"),
        descripcion: `${op.descripcion} · retiro en ${otra.sucursalNombre ?? "otra sucursal"}`,
      })
      cerrar()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={evento !== null} onOpenChange={(v) => !v && cerrar()}>
      <DialogContent className="max-w-md space-y-4 p-6">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center gap-2 text-destructive">
            <WarningOctagon className="size-5 shrink-0" />
            <DialogTitle className="font-heading text-base">Se agotó mientras estabas sin conexión</DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            Otra clienta compró la última {prenda}
            {detalle?.sucursalNombre ? ` en ${detalle.sucursalNombre}` : ""} antes de que tu pedido llegara.
            Tu compra se anuló y <strong>no se te cobró nada</strong>; las prendas siguen en tu carrito.
          </DialogDescription>
        </DialogHeader>

        <AlternativasConflicto alternativas={detalle?.alternativas} />

        <DialogFooter className="flex-wrap gap-2 pt-2">
          {op?.tenantId && (
            <Button variant="ghost" size="sm" onClick={() => { cerrar(); navigate(`/t/${op.tenantId}/carrito`) }}>
              Cambiar talla en el carrito
            </Button>
          )}
          {otra && op?.tipo === "CHECKOUT" ? (
            <Button size="sm" disabled={enviando} onClick={retirarEnOtra}>
              {enviando && <CircleNotch className="size-4 animate-spin" />}
              Retirar en {otra.sucursalNombre ?? "otra sucursal"}
            </Button>
          ) : (
            <Button size="sm" onClick={cerrar}>Entendido</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
