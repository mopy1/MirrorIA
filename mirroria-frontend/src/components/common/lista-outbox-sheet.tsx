import { ArrowsClockwise, CheckCircle, Clock, Tray, WarningCircle, XCircle } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useOutbox } from '@/lib/offline/use-outbox'
import type { EstadoOutbox } from '@/lib/offline/idb.types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId?: string
}

const BADGES_ESTADO: Record<EstadoOutbox, { label: string; className: string; Icon: typeof Clock }> = {
  PENDIENTE: { label: 'Pendiente', className: 'bg-amber-500/10 text-amber-700 border-amber-500/20', Icon: Clock },
  SINCRONIZANDO: { label: 'Enviando', className: 'bg-blue-500/10 text-blue-700 border-blue-500/20', Icon: ArrowsClockwise },
  SINCRONIZADO: { label: 'Sincronizado', className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20', Icon: CheckCircle },
  COMPENSADO: { label: 'Compensado', className: 'bg-purple-500/10 text-purple-700 border-purple-500/20', Icon: WarningCircle },
  FALLIDO: { label: 'Fallido', className: 'bg-destructive/10 text-destructive border-destructive/20', Icon: XCircle },
}

export function ListaOutboxSheet({ open, onOpenChange, tenantId }: Props) {
  const { operaciones, conteoPendientes, sincronizando, online, sincronizarAhora } = useOutbox(tenantId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md p-6">
        <SheetHeader className="space-y-1">
          <SheetTitle className="text-base font-heading">Cola de Sincronización Offline</SheetTitle>
          <SheetDescription className="text-xs">
            {online ? 'Conexión activa. Transacciones enviadas con Idempotency-Key.' : 'Modo offline. Las transacciones se enviarán al reconectar.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto divide-y divide-border/50 py-3">
          {operaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
              <Tray className="size-8 opacity-40" />
              <p className="text-xs">No hay operaciones en cola</p>
            </div>
          ) : (
            operaciones.map((op) => {
              const cfg = BADGES_ESTADO[op.estado] || BADGES_ESTADO.PENDIENTE
              const Icono = cfg.Icon
              return (
                <div key={op.id} className="py-2.5 flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground truncate max-w-[180px]">{op.tipo}</span>
                    <Badge variant="outline" className={`gap-1 px-1.5 py-0 text-[10px] ${cfg.className}`}>
                      <Icono className={`size-3 ${op.estado === 'SINCRONIZANDO' ? 'animate-spin' : ''}`} />
                      {cfg.label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                    <span className="truncate max-w-[190px]">{op.endpoint}</span>
                    <span>{new Date(op.creadoEn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                  {op.error && <p className="text-[10px] text-destructive italic mt-0.5">{op.error}</p>}
                </div>
              )
            })
          )}
        </div>

        <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">{conteoPendientes} pendiente(s)</span>
          <Button
            size="sm"
            disabled={!online || sincronizando || conteoPendientes === 0}
            onClick={() => sincronizarAhora()}
            className="gap-1.5 text-xs"
          >
            <ArrowsClockwise className={`size-3.5 ${sincronizando ? 'animate-spin' : ''}`} />
            Sincronizar ahora
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
