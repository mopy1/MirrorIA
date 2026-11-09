import { TOKEN_KEY, USER_KEY } from '../api'
import { clasificarRespuesta, esperaReintento, type CuerpoError } from './clasificar-respuesta'
import { actualizarOutbox, guardarEnOutbox, listarOutbox } from './idb'
import type { ConflictoStockEvento, DetalleConflictoStock, OperacionOutbox, TipoOperacionOutbox } from './idb.types'
import { EVENTO_ESTADO_RED, hayRed } from './red-simulada'

const API_URL = import.meta.env?.VITE_API_URL ?? 'http://localhost:3000/api/v1'
const TIMEOUT_MS = 15_000

export { EVENTO_ESTADO_RED }
export const EVENTO_CONFLICTO_STOCK = 'mirroria:conflicto-stock'
export const EVENTO_OUTBOX_ACTUALIZADO = 'mirroria:outbox-actualizado'
/** Un CHECKOUT encolado se confirmó: la venta nació PENDIENTE y ahora sí se puede pagar (RN08). */
export const EVENTO_COMPRA_CONFIRMADA = 'mirroria:compra-confirmada'

export interface EncolarOperacionParams {
  tenantId: string
  usuarioId: string
  tipo: TipoOperacionOutbox
  endpoint: string
  metodo?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  payload: Record<string, unknown>
  descripcion: string
  grupoId?: string | null
  meta?: Record<string, unknown>
  idempotencyKey?: string
}

interface Sesion { token: string; usuarioId: string; tenant: string | null }

function sesionActual(): Sesion | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const user = JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') as { id?: string; tenant?: { slug?: string } | null } | null
    return token && user?.id ? { token, usuarioId: user.id, tenant: user.tenant?.slug ?? null } : null
  } catch {
    return null
  }
}

const emitir = (tipo: string, detail?: unknown) => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(tipo, { detail }))
}

/** Cola FIFO de operaciones hechas sin red (CU10/CU11). Una sola instancia: `outboxManager`. */
export class OutboxManager {
  private sincronizando = false
  /** 401: la cola espera a que entre una sesión con OTRO token (JWT de 1 h, sin refresh). */
  private tokenPausado: string | null = null
  private reintento: ReturnType<typeof setTimeout> | null = null
  /** FIFO estricto: dos operaciones en el mismo milisegundo no deben empatar. */
  private ultimoCreado = 0

  constructor() {
    if (typeof window === 'undefined') return
    const alCambiarRed = () => {
      emitir(EVENTO_ESTADO_RED, { online: hayRed() })
      if (hayRed()) void this.procesarCola()
    }
    window.addEventListener('online', alCambiarRed)
    window.addEventListener('offline', () => emitir(EVENTO_ESTADO_RED, { online: hayRed() }))
    window.addEventListener(EVENTO_ESTADO_RED, () => { if (hayRed()) void this.procesarCola() })
  }

  isOnline = (): boolean => hayRed()
  isSincronizando = (): boolean => this.sincronizando
  estaPausada = (): boolean => this.tokenPausado !== null && sesionActual()?.token === this.tokenPausado

  async encolarOperacion(params: EncolarOperacionParams): Promise<OperacionOutbox> {
    const operacion: OperacionOutbox = {
      id: crypto.randomUUID(),
      tenantId: params.tenantId,
      usuarioId: params.usuarioId,
      idempotencyKey: params.idempotencyKey ?? crypto.randomUUID(),
      tipo: params.tipo,
      grupoId: params.grupoId ?? null,
      descripcion: params.descripcion,
      meta: params.meta,
      endpoint: params.endpoint,
      metodo: params.metodo ?? 'POST',
      payload: params.payload,
      estado: 'PENDIENTE',
      reintentos: 0,
      codigoRespuesta: null,
      respuesta: null,
      error: null,
      creadoEn: (this.ultimoCreado = Math.max(Date.now(), this.ultimoCreado + 1)),
      sincronizadoEn: null,
    }
    await guardarEnOutbox(operacion)
    emitir(EVENTO_OUTBOX_ACTUALIZADO)
    if (this.isOnline()) setTimeout(() => void this.procesarCola(), 0)
    return operacion
  }

  obtenerPendientes(tenantId?: string): Promise<OperacionOutbox[]> {
    return listarOutbox({ estado: 'PENDIENTE', tenantId })
  }

  /** Envía en orden FIFO las PENDIENTE de la clienta en sesión. COMPENSADA/RECHAZADA nunca se reenvían. */
  async procesarCola(): Promise<void> {
    const sesion = sesionActual()
    if (this.sincronizando || !this.isOnline() || !sesion) return
    if (this.tokenPausado === sesion.token) return
    this.tokenPausado = null
    this.sincronizando = true
    emitir(EVENTO_OUTBOX_ACTUALIZADO)
    try {
      const todas = await listarOutbox()
      const gruposCaidos = new Set(
        todas.filter((o) => (o.estado === 'COMPENSADA' || o.estado === 'RECHAZADA') && o.grupoId).map((o) => o.grupoId),
      )
      // ENVIANDO acá = la pestaña se cerró en vuelo: se reenvía con la misma clave (HIT si el servidor llegó).
      const candidatas = todas.filter(
        (o) => (o.estado === 'PENDIENTE' || o.estado === 'ENVIANDO') && o.usuarioId === sesion.usuarioId && o.tenantId === sesion.tenant,
      )
      for (const op of candidatas) {
        if (op.grupoId && gruposCaidos.has(op.grupoId)) {
          await actualizarOutbox(op.id, { estado: 'RECHAZADA', error: 'Cancelada porque falló el paso anterior' })
          continue
        }
        const seguir = await this.enviar(op, sesion.token, gruposCaidos)
        emitir(EVENTO_OUTBOX_ACTUALIZADO)
        if (!seguir) break
      }
    } finally {
      this.sincronizando = false
      emitir(EVENTO_OUTBOX_ACTUALIZADO)
    }
  }

  /** Envía una operación y la clasifica; devuelve false si el ciclo FIFO debe cortarse. */
  private async enviar(op: OperacionOutbox, token: string, gruposCaidos: Set<string | null>): Promise<boolean> {
    await actualizarOutbox(op.id, { estado: 'ENVIANDO' })
    emitir(EVENTO_OUTBOX_ACTUALIZADO)
    let status = 0
    let body: Record<string, unknown> | null = null
    try {
      const res = await fetch(`${API_URL}${op.endpoint}`, {
        method: op.metodo,
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': op.idempotencyKey,
          'X-Tenant': op.tenantId,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(op.payload),
        signal: typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(TIMEOUT_MS) : undefined,
      })
      status = res.status
      body = res.status === 204 ? {} : ((await res.json().catch(() => ({}))) as Record<string, unknown>)
    } catch (err) {
      body = { message: err instanceof Error ? err.message : 'Error de red' }
    }

    const c = clasificarRespuesta(status, body as CuerpoError)
    if (c.estado === 'CONFIRMADA') {
      await actualizarOutbox(op.id, { estado: 'CONFIRMADA', codigoRespuesta: status, respuesta: body, error: null, sincronizadoEn: Date.now() })
      if (op.tipo === 'CHECKOUT') emitir(EVENTO_COMPRA_CONFIRMADA, { operacion: op, venta: body })
      return true
    }
    if (c.estado === 'COMPENSADA' || c.estado === 'RECHAZADA') {
      await actualizarOutbox(op.id, { estado: c.estado, codigoRespuesta: status, respuesta: body, error: c.motivo })
      if (op.grupoId) gruposCaidos.add(op.grupoId)
      if (c.estado === 'COMPENSADA') {
        const detalle = ((body?.detalles as DetalleConflictoStock | undefined) ?? {}) as DetalleConflictoStock
        emitir(EVENTO_CONFLICTO_STOCK, { detalle, operacion: op } satisfies ConflictoStockEvento)
      }
      return true
    }
    const reintentos = c.accion === 'REINTENTAR' ? op.reintentos + 1 : op.reintentos
    await actualizarOutbox(op.id, { estado: 'PENDIENTE', codigoRespuesta: status || null, error: c.motivo, reintentos })
    if (c.accion === 'PAUSAR') this.tokenPausado = token
    else this.programarReintento(reintentos)
    return false
  }

  /** Corta el reintento programado (tests y cierre de sesión). */
  detener(): void {
    if (this.reintento) clearTimeout(this.reintento)
    this.reintento = null
  }

  private programarReintento(n: number): void {
    if (this.reintento) clearTimeout(this.reintento)
    this.reintento = setTimeout(() => {
      this.reintento = null
      void this.procesarCola()
    }, esperaReintento(n))
  }
}

export const outboxManager = new OutboxManager()
