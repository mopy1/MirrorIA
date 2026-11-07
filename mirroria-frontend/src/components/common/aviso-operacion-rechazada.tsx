import { useEffect, useState } from "react"
import { WarningCircle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EVENTO_OPERACION_RECHAZADA } from "@/lib/offline/outbox-manager"

interface Rechazo { tipo: string; mensaje: string }

/** Una venta hecha sin conexión que el servidor rechazó: quien la hizo tiene que enterarse. */
export function AvisoOperacionRechazada() {
  const [rechazos, setRechazos] = useState<Rechazo[]>([])

  useEffect(() => {
    const alRechazo = (e: Event) => setRechazos((r) => [...r, (e as CustomEvent<Rechazo>).detail])
    window.addEventListener(EVENTO_OPERACION_RECHAZADA, alRechazo)
    return () => window.removeEventListener(EVENTO_OPERACION_RECHAZADA, alRechazo)
  }, [])

  return (
    <Dialog open={rechazos.length > 0} onOpenChange={(abierto) => !abierto && setRechazos([])}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2"><WarningCircle className="size-5 text-destructive" /> Una venta sin conexión no entró</DialogTitle>
          <DialogDescription>
            El servidor la rechazó al sincronizar. Si ya cobraste, devolvé el dinero o registrala de nuevo.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          {rechazos.map((r, i) => <li key={i} className="rounded-lg border border-border/60 p-3">{r.mensaje}</li>)}
        </ul>
        <DialogFooter><Button onClick={() => setRechazos([])}>Entendido</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
