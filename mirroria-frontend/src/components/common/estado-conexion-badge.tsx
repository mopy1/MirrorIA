import { useEffect, useRef, useState } from 'react'
import { ArrowsClockwise, WifiHigh, WifiSlash } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSesionEnTienda } from '@/hooks/useSesionEnTienda'
import { useTienda } from '@/hooks/useTienda'
import { EVENTO_ABRIR_OUTBOX, useOutbox } from '@/lib/offline/use-outbox'
import { ListaOutboxSheet } from './lista-outbox-sheet'
import { cn } from 'cn'

interface Props {
  className?: string
  /** Fuera de `/t/:slug` (panel admin) se pasa a mano; en la tienda sale del contexto. */
  tenantId?: string
}

/** Indicador de red + conteo de pendientes; abre la outbox (también con `abrirOutbox()`). */
export function EstadoConexionBadge({ className, tenantId }: Props) {
  const { slug } = useTienda()
  const clienta = useSesionEnTienda()
  const tenant = tenantId ?? slug ?? undefined
  const [sheetAbierto, setSheetAbierto] = useState(false)
  const boton = useRef<HTMLButtonElement>(null)
  const { online, simulado, sincronizando, conteoPendientes } = useOutbox({ tenantId: tenant, usuarioId: clienta?.id })

  useEffect(() => {
    // Puede haber dos badges montados (móvil/escritorio): abre solo el visible.
    const abrir = () => {
      if (boton.current?.offsetParent !== null) setSheetAbierto(true)
    }
    window.addEventListener(EVENTO_ABRIR_OUTBOX, abrir)
    return () => window.removeEventListener(EVENTO_ABRIR_OUTBOX, abrir)
  }, [])

  // En la vitrina, a la visitante sin sesión y con red no le aporta nada.
  if (!tenantId && !clienta && online && conteoPendientes === 0) return null

  const texto = sincronizando ? 'Enviando…' : online ? 'Con conexión' : simulado ? 'Sin red (demo)' : 'Sin conexión'

  return (
    <>
      <Button
        ref={boton}
        variant="ghost"
        size="sm"
        onClick={() => setSheetAbierto(true)}
        className={cn(
          'h-8 gap-1.5 rounded-full border px-2 text-xs font-medium transition-colors',
          online
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400',
          className
        )}
        title={online ? 'Con conexión' : 'Sin conexión: lo que hagas queda pendiente de confirmar'}
        aria-label={`${texto}. Ver pendientes de este dispositivo`}
      >
        {sincronizando ? (
          <ArrowsClockwise className="size-3.5 animate-spin" />
        ) : online ? (
          <WifiHigh className="size-3.5" />
        ) : (
          <WifiSlash className="size-3.5" />
        )}
        <span className="hidden sm:inline">{texto}</span>
        {conteoPendientes > 0 && (
          <Badge variant="secondary" className="ml-0.5 h-4 min-w-4 rounded-full bg-amber-500/20 px-1 text-[10px] text-amber-800 dark:text-amber-300">
            {conteoPendientes}
          </Badge>
        )}
      </Button>

      <ListaOutboxSheet open={sheetAbierto} onOpenChange={setSheetAbierto} tenantId={tenant} usuarioId={clienta?.id} />
    </>
  )
}
