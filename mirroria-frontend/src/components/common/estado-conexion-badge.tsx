import { useState } from 'react'
import { ArrowsClockwise, WifiHigh, WifiSlash } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useOutbox } from '@/lib/offline/use-outbox'
import { ListaOutboxSheet } from './lista-outbox-sheet'
import { cn } from 'cn'

interface Props {
  className?: string
  tenantId?: string
}

export function EstadoConexionBadge({ className, tenantId }: Props) {
  const [sheetAbierto, setSheetAbierto] = useState(false)
  const { online, sincronizando, conteoPendientes } = useOutbox(tenantId)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSheetAbierto(true)}
        className={cn(
          'h-8 gap-1.5 px-2 text-xs font-medium transition-colors rounded-full border',
          online
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400',
          className
        )}
        title={online ? 'Conectado a Internet' : 'Sin conexión — Modo offline'}
        aria-label="Estado de conexión e historial de sincronización"
      >
        {sincronizando ? (
          <ArrowsClockwise className="size-3.5 animate-spin text-primary" />
        ) : online ? (
          <WifiHigh className="size-3.5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <WifiSlash className="size-3.5 text-amber-600 dark:text-amber-400" />
        )}

        <span className="hidden sm:inline">
          {sincronizando ? 'Sincronizando...' : online ? 'Online' : 'Modo Offline'}
        </span>

        {conteoPendientes > 0 && (
          <Badge
            variant="secondary"
            className="ml-0.5 h-4 min-w-4 px-1 text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 rounded-full"
          >
            {conteoPendientes}
          </Badge>
        )}
      </Button>

      <ListaOutboxSheet open={sheetAbierto} onOpenChange={setSheetAbierto} tenantId={tenantId} />
    </>
  )
}
