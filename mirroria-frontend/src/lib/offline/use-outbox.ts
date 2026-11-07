import { useCallback, useEffect, useState } from 'react'
import { EVENTO_CONFLICTO_STOCK, EVENTO_ESTADO_RED, EVENTO_OUTBOX_ACTUALIZADO, outboxManager } from './outbox-manager'
import { listarOutbox, type FiltroOutbox } from './idb'
import type { ConflictoStockEvento, OperacionOutbox } from './idb.types'
import { hayRed, setSinRedSimulado, sinRedSimulado } from './red-simulada'

/** Abre la `ListaOutboxSheet` desde cualquier pantalla (p. ej. "Ver pendientes" del checkout). */
export const EVENTO_ABRIR_OUTBOX = 'mirroria:abrir-outbox'
export const abrirOutbox = () => window.dispatchEvent(new Event(EVENTO_ABRIR_OUTBOX))

const enCurso = (o: OperacionOutbox) => o.estado === 'PENDIENTE' || o.estado === 'ENVIANDO'

/** Red, cola y modo demo en vivo. Filtra por tienda y, si se pasa, por clienta. */
export function useOutbox(filtro: Pick<FiltroOutbox, 'tenantId' | 'usuarioId'> = {}) {
  const { tenantId, usuarioId } = filtro
  const [online, setOnline] = useState(hayRed)
  const [simulado, setSimulado] = useState(sinRedSimulado)
  const [sincronizando, setSincronizando] = useState(outboxManager.isSincronizando())
  const [pausada, setPausada] = useState(outboxManager.estaPausada())
  const [operaciones, setOperaciones] = useState<OperacionOutbox[]>([])

  const refrescar = useCallback(async () => {
    let ops: OperacionOutbox[] | null = null
    try {
      ops = await listarOutbox({ tenantId, usuarioId })
    } catch {
      // Sin IndexedDB (navegador viejo o tests): la cola queda vacía.
    }
    setOnline(hayRed())
    setSimulado(sinRedSimulado())
    setSincronizando(outboxManager.isSincronizando())
    setPausada(outboxManager.estaPausada())
    if (ops) setOperaciones(ops)
  }, [tenantId, usuarioId])

  useEffect(() => {
    void refrescar()
    const handler = () => void refrescar()
    const eventos = [EVENTO_OUTBOX_ACTUALIZADO, EVENTO_ESTADO_RED, 'online', 'offline']
    eventos.forEach((e) => window.addEventListener(e, handler))
    return () => eventos.forEach((e) => window.removeEventListener(e, handler))
  }, [refrescar])

  const pendientes = operaciones.filter(enCurso)
  return {
    online,
    simulado,
    setSimulado: setSinRedSimulado,
    sincronizando,
    pausada,
    operaciones,
    pendientes,
    conteoPendientes: pendientes.length,
    sincronizarAhora: () => outboxManager.procesarCola(),
  }
}

export function useConflictoStockListener(onConflicto: (evento: ConflictoStockEvento) => void) {
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<ConflictoStockEvento>
      if (custom.detail) onConflicto(custom.detail)
    }
    window.addEventListener(EVENTO_CONFLICTO_STOCK, handler)
    return () => window.removeEventListener(EVENTO_CONFLICTO_STOCK, handler)
  }, [onConflicto])
}
