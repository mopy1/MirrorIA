import { useCallback, useEffect, useState } from 'react'
import { EVENTO_CONFLICTO_STOCK, EVENTO_ESTADO_RED, EVENTO_OUTBOX_ACTUALIZADO, outboxManager } from './outbox-manager'
import { listarOutbox } from './idb'
import type { DetalleConflictoStock, OperacionOutbox } from './idb.types'

export function useOutbox(tenantId?: string) {
  const [online, setOnline] = useState(outboxManager.isOnline())
  const [sincronizando, setSincronizando] = useState(outboxManager.isSincronizando())
  const [operaciones, setOperaciones] = useState<OperacionOutbox[]>([])
  const [pendientes, setPendientes] = useState<OperacionOutbox[]>([])

  const refrescar = useCallback(async () => {
    try {
      const ops = await listarOutbox({ tenantId })
      setOperaciones(ops)
      setPendientes(ops.filter((o) => o.estado === 'PENDIENTE'))
      setSincronizando(outboxManager.isSincronizando())
    } catch {
      // Ignorar en entornos sin IDB
    }
  }, [tenantId])

  useEffect(() => {
    void refrescar()
    const handleActualizado = () => { void refrescar() }
    const handleRed = (e: Event) => {
      const custom = e as CustomEvent<{ online: boolean }>
      setOnline(custom.detail?.online ?? navigator.onLine)
      void refrescar()
    }

    window.addEventListener(EVENTO_OUTBOX_ACTUALIZADO, handleActualizado)
    window.addEventListener(EVENTO_ESTADO_RED, handleRed)
    window.addEventListener('online', () => setOnline(true))
    window.addEventListener('offline', () => setOnline(false))

    return () => {
      window.removeEventListener(EVENTO_OUTBOX_ACTUALIZADO, handleActualizado)
      window.removeEventListener(EVENTO_ESTADO_RED, handleRed)
    }
  }, [refrescar])

  return {
    online,
    sincronizando,
    operaciones,
    pendientes,
    conteoPendientes: pendientes.length,
    sincronizarAhora: () => outboxManager.procesarCola(),
  }
}

export function useConflictoStockListener(onConflicto: (detalle: DetalleConflictoStock) => void) {
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<DetalleConflictoStock>
      if (custom.detail) onConflicto(custom.detail)
    }
    window.addEventListener(EVENTO_CONFLICTO_STOCK, handler)
    return () => window.removeEventListener(EVENTO_CONFLICTO_STOCK, handler)
  }, [onConflicto])
}
