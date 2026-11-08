import { useCallback, useEffect, useState } from "react"
import { WarningCircle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatMoney } from "@/lib/money"
import { actualizarOutbox, listarOutbox } from "@/lib/offline/idb"
import type { OperacionOutbox } from "@/lib/offline/idb.types"
import { EVENTO_OPERACION_RECHAZADA } from "@/lib/offline/outbox-manager"

interface Linea { cantidad: number; precioUnitCents?: number }

function resumen(op: OperacionOutbox): string {
  const items = ((op.payload as { items?: Linea[] }).items ?? [])
  const prendas = items.reduce((a, i) => a + i.cantidad, 0)
  const total = items.reduce((a, i) => a + i.cantidad * (i.precioUnitCents ?? 0), 0)
  const hora = new Date(op.creadoEn).toLocaleString("es-BO", { dateStyle: "short", timeStyle: "short" })
  return `Venta del ${hora}: ${prendas} ${prendas === 1 ? "prenda" : "prendas"}${total ? ` por ${formatMoney(total)}` : ""}`
}

/**
 * Una venta hecha sin conexión que el servidor rechazó. Queda guardada hasta que
 * alguien la lee: si se recarga la página o se cierra sesión, el aviso vuelve.
 */
export function AvisoOperacionRechazada() {
  const [rechazos, setRechazos] = useState<OperacionOutbox[]>([])

  const cargar = useCallback(async () => {
    try {
      setRechazos((await listarOutbox({ estado: "FALLIDO" })).filter((o) => !o.avisado))
    } catch {
      /* sin IndexedDB */
    }
  }, [])

  useEffect(() => {
    void cargar()
    const alRechazo = () => void cargar()
    window.addEventListener(EVENTO_OPERACION_RECHAZADA, alRechazo)
    return () => window.removeEventListener(EVENTO_OPERACION_RECHAZADA, alRechazo)
  }, [cargar])

  async function entendido() {
    await Promise.all(rechazos.map((o) => actualizarOutbox(o.id, { avisado: true }).catch(() => null)))
    setRechazos([])
  }

  return (
    <Dialog open={rechazos.length > 0} onOpenChange={(abierto) => !abierto && void entendido()}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2"><WarningCircle className="size-5 text-destructive" /> Una venta sin conexión no entró</DialogTitle>
          <DialogDescription>
            El servidor la rechazó al sincronizar. Si ya cobraste, devolvé el dinero o registrala de nuevo.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          {rechazos.map((o) => (
            <li key={o.id} className="rounded-lg border border-border/60 p-3">
              <span className="block font-medium">{resumen(o)}</span>
              <span className="block text-muted-foreground">{o.error ?? "Rechazada"}</span>
            </li>
          ))}
        </ul>
        <DialogFooter><Button onClick={() => void entendido()}>Entendido</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
