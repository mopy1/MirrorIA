export { REGEX_SLUG, SLUGS_RESERVADOS, TIENDA_DEMO_ID } from '../../core/tenancy/tenant.constants.js';

/** Meses que suma cada pago de la suscripción (Fase 2). */
export const MESES_POR_PAGO = 1;
/** Cada cuánto corre la barrida de suscripciones vencidas. */
export const HORAS_BARRIDA = 1;
/** TTL de la caché del resolvedor de tiendas. */
export const SEGUNDOS_CACHE_TENANT = 60;
export const MS_DIA = 24 * 60 * 60 * 1000;

/** ceil((fin - ahora) / día), mínimo 0. */
export function diasRestantes(fin: Date, ahora = Date.now()): number {
  return Math.max(0, Math.ceil((fin.getTime() - ahora) / MS_DIA));
}

export function sumarMeses(desde: Date, meses: number): Date {
  const d = new Date(desde.getTime());
  d.setMonth(d.getMonth() + meses);
  return d;
}
