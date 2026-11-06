import { cabecerasTenant } from '../api'
import { actualizarOutbox, guardarEnOutbox, listarOutbox } from './idb'
import type { OperacionOutbox } from './idb.types'

const API_URL = import.meta.env?.VITE_API_URL ?? 'http://localhost:3000/api/v1'

export const EVENTO_CONFLICTO_STOCK = 'mirroria:conflicto-stock'
export const EVENTO_OUTBOX_ACTUALIZADO = 'mirroria:outbox-actualizado'
export const EVENTO_ESTADO_RED = 'mirroria:estado-red'

export interface EncolarOperacionParams {
  tenantId: string
  tipo: string
  endpoint: string
  metodo?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  payload: Record<string, unknown>
  idempotencyKey?: string
}

export class OutboxManager {
  private sincronizando = false

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        window.dispatchEvent(new CustomEvent(EVENTO_ESTADO_RED, { detail: { online: true } }))
        this.procesarCola().catch(() => {})
      })
      window.addEventListener('offline', () => {
        window.dispatchEvent(new CustomEvent(EVENTO_ESTADO_RED, { detail: { online: false } }))
      })
    }
  }

  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  }

  isSincronizando(): boolean {
    return this.sincronizando
  }

  async encolarOperacion(params: EncolarOperacionParams): Promise<OperacionOutbox> {
    const operacion: OperacionOutbox = {
      id: crypto.randomUUID(),
      tenantId: params.tenantId,
      idempotencyKey: params.idempotencyKey ?? crypto.randomUUID(),
      tipo: params.tipo,
      endpoint: params.endpoint,
      metodo: params.metodo ?? 'POST',
      payload: params.payload,
      estado: 'PENDIENTE',
      reintentos: 0,
      codigoRespuesta: null,
      respuesta: null,
      error: null,
      creadoEn: Date.now(),
      sincronizadoEn: null,
    }

    await guardarEnOutbox(operacion)
    this.notificarCambio()

    if (this.isOnline()) {
      setTimeout(() => this.procesarCola().catch(() => {}), 10)
    }

    return operacion
  }

  async obtenerPendientes(tenantId?: string): Promise<OperacionOutbox[]> {
    return listarOutbox({ estado: 'PENDIENTE', tenantId })
  }

  async procesarCola(): Promise<void> {
    if (this.sincronizando || !this.isOnline()) return
    this.sincronizando = true

    try {
      const pendientes = await listarOutbox({ estado: 'PENDIENTE' })
      for (const op of pendientes) {
        await actualizarOutbox(op.id, { estado: 'SINCRONIZANDO' })
        this.notificarCambio()

        try {
          const res = await fetch(`${API_URL}${op.endpoint}`, {
            method: op.metodo,
            headers: {
              'Content-Type': 'application/json',
              'Idempotency-Key': op.idempotencyKey,
              ...cabecerasTenant('auto'),
            },
            body: JSON.stringify(op.payload),
          })

          if (res.ok) {
            const data = (res.status === 204 ? {} : await res.json().catch(() => ({}))) as Record<string, unknown>
            await actualizarOutbox(op.id, {
              estado: 'SINCRONIZADO',
              codigoRespuesta: res.status,
              respuesta: data,
              sincronizadoEn: Date.now(),
            })
          } else {
            const errorBody = (await res.json().catch(() => ({}))) as Record<string, unknown>
            if (res.status === 409 && errorBody?.codigo === 'STOCK_AGOTADO_CONFLICTO') {
              await actualizarOutbox(op.id, {
                estado: 'COMPENSADO',
                codigoRespuesta: 409,
                respuesta: errorBody,
                error: (errorBody.message as string) || 'Stock agotado',
              })
              if (typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent(EVENTO_CONFLICTO_STOCK, { detail: errorBody.detalles ?? errorBody })
                )
              }
            } else {
              await actualizarOutbox(op.id, {
                estado: 'FALLIDO',
                codigoRespuesta: res.status,
                error: (errorBody.message as string) || res.statusText,
              })
            }
          }
        } catch (netErr) {
          const msg = netErr instanceof Error ? netErr.message : 'Error de red'
          await actualizarOutbox(op.id, { estado: 'PENDIENTE', reintentos: op.reintentos + 1, error: msg })
          break // Detener procesamiento FIFO secuencial ante caída de red
        } finally {
          this.notificarCambio()
        }
      }
    } finally {
      this.sincronizando = false
      this.notificarCambio()
    }
  }

  private notificarCambio(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENTO_OUTBOX_ACTUALIZADO))
    }
  }
}

export const outboxManager = new OutboxManager()
