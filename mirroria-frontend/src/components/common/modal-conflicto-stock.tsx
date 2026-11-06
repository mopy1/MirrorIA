import { useState } from 'react'
import { Buildings, CoatHanger, WarningOctagon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useConflictoStockListener } from '@/lib/offline/use-outbox'
import type { DetalleConflictoStock } from '@/lib/offline/idb.types'

export function ModalConflictoStock() {
  const [abierto, setAbierto] = useState(false)
  const [detalle, setDetalle] = useState<DetalleConflictoStock | null>(null)

  useConflictoStockListener((datos) => {
    setDetalle(datos)
    setAbierto(true)
  })

  const otrasSucursales = detalle?.alternativas?.otrasSucursales ?? []
  const otrasTallas = detalle?.alternativas?.otrasTallas ?? []

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogContent className="max-w-md p-6 space-y-4">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <WarningOctagon className="size-5 shrink-0" />
            <DialogTitle className="text-base font-heading">Conflicto de Inventario (stock = 1)</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            La prenda seleccionada acaba de ser adquirida por otra clienta. Tu venta local fue cancelada sin cobro.
          </DialogDescription>
        </DialogHeader>

        {detalle && (
          <div className="rounded-lg border border-border/80 bg-muted/40 p-3 text-xs space-y-1.5">
            <div className="font-semibold text-foreground">{detalle.prendaNombre ?? 'Prenda solicitada'}</div>
            <div className="text-muted-foreground flex gap-3 text-[11px]">
              {detalle.talla && <span>Talla: <strong>{detalle.talla}</strong></span>}
              {detalle.color && <span>Color: <strong>{detalle.color}</strong></span>}
              {detalle.sucursalNombre && <span>Sucursal: <strong>{detalle.sucursalNombre}</strong></span>}
            </div>
          </div>
        )}

        {(otrasSucursales.length > 0 || otrasTallas.length > 0) && (
          <div className="space-y-2 text-xs">
            <span className="font-medium text-foreground">Alternativas disponibles:</span>
            {otrasSucursales.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Buildings className="size-3.5" /> En otras sucursales:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {otrasSucursales.map((s) => (
                    <span key={s.sucursalId} className="rounded border px-2 py-0.5 text-[11px] bg-background">
                      {s.sucursalNombre}: <strong>{s.disponible} disp.</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {otrasTallas.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <CoatHanger className="size-3.5" /> En otras tallas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {otrasTallas.map((t) => (
                    <span key={t.varianteId} className="rounded border px-2 py-0.5 text-[11px] bg-background">
                      Talla {t.talla}: <strong>{t.disponible} disp.</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="pt-2 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setAbierto(false)}>
            Cerrar
          </Button>
          <Button size="sm" onClick={() => setAbierto(false)}>
            Entendido, continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
