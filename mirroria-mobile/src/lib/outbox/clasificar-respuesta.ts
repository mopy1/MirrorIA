/**
 * Qué hacer con la respuesta del backend a una operación de la outbox (spec §5.4).
 * Puro y con tests; mismo criterio que la PWA.
 */
export type Clasificacion =
  | { estado: 'CONFIRMADA' }
  | { estado: 'COMPENSADA'; motivo: string }
  | { estado: 'RECHAZADA'; motivo: string }
  | { estado: 'PENDIENTE'; accion: 'PAUSAR' | 'REINTENTAR'; motivo: string };

interface CuerpoError {
  codigo?: unknown;
  message?: unknown;
}

function texto(cuerpo: CuerpoError | null, defecto: string): string {
  const m = cuerpo?.message;
  if (Array.isArray(m)) return m.join('. ') || defecto;
  return typeof m === 'string' && m ? m : defecto;
}

export function clasificarRespuesta(status: number, cuerpo: CuerpoError | null): Clasificacion {
  if (status >= 200 && status < 300) return { estado: 'CONFIRMADA' };
  if (status === 409 && cuerpo?.codigo === 'STOCK_AGOTADO_CONFLICTO') {
    return { estado: 'COMPENSADA', motivo: 'Anulada: otra clienta se llevó la última unidad' };
  }
  if (status === 409 && cuerpo?.codigo === 'IDEMPOTENCIA_EN_CURSO') {
    return { estado: 'PENDIENTE', accion: 'REINTENTAR', motivo: 'La tienda todavía la está procesando' };
  }
  if (status === 401) {
    return { estado: 'PENDIENTE', accion: 'PAUSAR', motivo: 'Tu sesión venció: iniciá sesión para enviarla' };
  }
  const msg = texto(cuerpo, '');
  if (status === 403 && /no está disponible|otra tienda/i.test(msg)) {
    return { estado: 'PENDIENTE', accion: 'PAUSAR', motivo: msg };
  }
  if (status === 0 || status === 408 || status === 429 || status >= 500) {
    return { estado: 'PENDIENTE', accion: 'REINTENTAR', motivo: texto(cuerpo, 'Sin respuesta de la tienda') };
  }
  if (status === 422) {
    return { estado: 'RECHAZADA', motivo: 'La tienda recibió otra versión de esta operación (422). No se reenvía.' };
  }
  return { estado: 'RECHAZADA', motivo: texto(cuerpo, `La tienda la rechazó (HTTP ${status})`) };
}

const ESPERAS_S = [2, 4, 8, 16, 30];

/** Espera antes del reintento n (1, 2, …): 2-4-8-16-30 s (tope) con ±20 % de jitter. */
export function esperaReintento(n: number, azar: number = Math.random()): number {
  const base = ESPERAS_S[Math.min(Math.max(n, 1), ESPERAS_S.length) - 1] * 1000;
  return Math.round(base * (0.8 + azar * 0.4));
}
