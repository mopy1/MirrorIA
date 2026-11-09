/**
 * Qué hacer con la respuesta del backend a una operación de la outbox
 * (Movil_Spec §5.4, mismo criterio que la app móvil). Puro, con tests.
 */
export type Clasificacion =
  | { estado: 'CONFIRMADA' }
  | { estado: 'COMPENSADA'; motivo: string }
  | { estado: 'RECHAZADA'; motivo: string }
  | { estado: 'PENDIENTE'; accion: 'PAUSAR' | 'REINTENTAR'; motivo: string }

export interface CuerpoError {
  codigo?: string
  message?: string | string[]
}

const texto = (body: CuerpoError | null, defecto: string) => {
  const m = body?.message
  return (Array.isArray(m) ? m.join(', ') : m) || defecto
}

export function clasificarRespuesta(status: number, body: CuerpoError | null): Clasificacion {
  if (status >= 200 && status < 300) return { estado: 'CONFIRMADA' }
  if (status === 409 && body?.codigo === 'STOCK_AGOTADO_CONFLICTO') {
    return { estado: 'COMPENSADA', motivo: 'Anulada: otra clienta se llevó la última unidad' }
  }
  if (status === 409 && body?.codigo === 'IDEMPOTENCIA_EN_CURSO') {
    return { estado: 'PENDIENTE', accion: 'REINTENTAR', motivo: 'El servidor todavía la está procesando' }
  }
  if (status === 401) {
    return { estado: 'PENDIENTE', accion: 'PAUSAR', motivo: 'Tu sesión venció: iniciá sesión para enviarla' }
  }
  const msg = texto(body, '')
  if (status === 403 && (body?.codigo === 'TIENDA_NO_DISPONIBLE' || /no está disponible|otra tienda/i.test(msg))) {
    return { estado: 'PENDIENTE', accion: 'PAUSAR', motivo: msg }
  }
  if (status === 0 || status === 408 || status === 429 || status >= 500) {
    return { estado: 'PENDIENTE', accion: 'REINTENTAR', motivo: texto(body, 'Sin respuesta del servidor') }
  }
  return { estado: 'RECHAZADA', motivo: texto(body, `El servidor la rechazó (HTTP ${status})`) }
}

const ESPERAS_S = [2, 4, 8, 16, 30]

/** Espera antes del reintento n (1, 2, …): 2-4-8-16-30 s con ±20 % de jitter. */
export function esperaReintento(n: number, azar: number = Math.random()): number {
  const base = ESPERAS_S[Math.min(Math.max(n, 1), ESPERAS_S.length) - 1] * 1000
  return Math.round(base * (0.8 + azar * 0.4))
}
