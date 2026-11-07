import { useState } from "react"
import { ArrowsClockwise, CircleNotch, Tray } from "@phosphor-icons/react"
import { useNavigate } from "react-router-dom"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useAuth } from "@/hooks/useAuth"
import { eliminarDeOutbox } from "@/lib/offline/idb"
import { EVENTO_OUTBOX_ACTUALIZADO } from "@/lib/offline/outbox-manager"
import { useOutbox } from "@/lib/offline/use-outbox"
import { FilaOutbox } from "./fila-outbox"
import { InterruptorSinRed } from "./interruptor-sin-red"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId?: string
  usuarioId?: string
}

/** "Pendientes": la outbox de la clienta (FIFO), el interruptor de demo y el envío manual. */
export function ListaOutboxSheet({ open, onOpenChange, tenantId, usuarioId }: Props) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const o = useOutbox({ tenantId, usuarioId })
  const [limpiando, setLimpiando] = useState(false)
  const terminadas = o.operaciones.filter((op) => op.estado !== "PENDIENTE" && op.estado !== "ENVIANDO")
  // Las que fallaron arriba (con color), después las en curso en orden FIFO y al final las confirmadas.
  const orden = { COMPENSADA: 0, RECHAZADA: 0, PENDIENTE: 1, ENVIANDO: 1, CONFIRMADA: 2 }
  const lista = [...o.operaciones].sort((a, b) => orden[a.estado] - orden[b.estado] || a.creadoEn - b.creadoEn)

  async function limpiar() {
    setLimpiando(true)
    await Promise.all(terminadas.map((op) => eliminarDeOutbox(op.id)))
    window.dispatchEvent(new Event(EVENTO_OUTBOX_ACTUALIZADO))
    setLimpiando(false)
  }

  function reingresar() {
    logout()
    onOpenChange(false)
    navigate(tenantId ? `/t/${tenantId}/login` : "/entrar")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-3 p-6 sm:max-w-md">
        <SheetHeader className="space-y-1 p-0">
          <SheetTitle className="font-heading text-base">Pendientes de este dispositivo</SheetTitle>
          <SheetDescription className="text-xs">
            {o.online
              ? "Con conexión: lo guardado se envía en orden, cada operación con su Idempotency-Key."
              : "Sin conexión: lo que hagas queda pendiente de confirmar y se envía solo al volver la red. Nunca se paga sin red."}
          </SheetDescription>
        </SheetHeader>

        <InterruptorSinRed activo={o.simulado} onChange={o.setSimulado} />

        {o.pausada && (
          <Alert variant="destructive">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
              Tu sesión venció: la cola está en pausa hasta que vuelvas a entrar.
              <Button size="sm" variant="outline" onClick={reingresar}>Iniciar sesión</Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex-1 divide-y divide-border/60 overflow-y-auto">
          {lista.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
              <Tray className="size-8 opacity-40" />
              <p className="text-xs">Todo enviado. Si te quedás sin red, lo que hagas aparece acá.</p>
            </div>
          ) : (
            lista.map((op) => <FilaOutbox key={op.id} op={op} onAccion={() => onOpenChange(false)} />)
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
          <Button size="sm" variant="ghost" className="text-xs" disabled={terminadas.length === 0 || limpiando} onClick={limpiar}>
            {limpiando && <CircleNotch className="size-3.5 animate-spin" />}
            Quitar terminadas
          </Button>
          <Button size="sm" className="gap-1.5 text-xs" disabled={!o.online || o.sincronizando || o.conteoPendientes === 0} onClick={() => o.sincronizarAhora()}>
            <ArrowsClockwise className={o.sincronizando ? "size-3.5 animate-spin" : "size-3.5"} />
            Enviar ahora ({o.conteoPendientes})
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
