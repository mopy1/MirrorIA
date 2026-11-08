import type { UsuarioRole } from '../../auth/types/auth.types';
import type { AnomaliasVentasResponse, FiltroDemanda } from '../types/ml.types';
import type { TabPrediccion } from './ml-tabs';

/** Predicciones: mismo permiso que el menú (ADMIN y encargada). La cajera ve un aviso. */
export function puedeVerPredicciones(role: UsuarioRole | undefined): boolean {
  return role === 'ADMIN' || role === 'ENCARGADO_SUCURSAL';
}

export interface ConsultasPermitidas {
  demanda: boolean;
  noShow: boolean;
  rfm: boolean;
  anomalias: boolean;
  metricas: boolean;
}

/**
 * Qué modelos puede pedir cada rol (mismos @Roles del backend): clientas (RFM) y ventas
 * inusuales (anomalías) son solo de la dueña. Así la encargada no recibe un 403 disfrazado de error.
 */
export function consultasPermitidas(role: UsuarioRole | undefined): ConsultasPermitidas {
  const gestion = puedeVerPredicciones(role);
  const admin = role === 'ADMIN';
  return { demanda: gestion, noShow: gestion, rfm: admin, anomalias: admin, metricas: gestion };
}

/** Pestañas que dependen de un modelo solo-dueña. */
export function tabSoloDuena(tab: TabPrediccion): boolean {
  return tab === 'rfm' || tab === 'auditoria';
}

/**
 * ¿La respuesta es la estimación de respaldo? Manda la cabecera `X-ML-Fallback`; si el navegador
 * no la deja leer (CORS sin expose) o no vino, se usa la bandera `fallback` del cuerpo.
 */
export function esFallback(cabecera: string | null | undefined, cuerpo: unknown): boolean {
  if (cabecera != null && cabecera !== '') return cabecera.trim().toLowerCase() === 'true';
  return Boolean(cuerpo && typeof cuerpo === 'object' && (cuerpo as { fallback?: unknown }).fallback === true);
}

function conQuery(ruta: string, params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') q.set(k, String(v));
  const qs = q.toString();
  return `${ruta}${qs ? `?${qs}` : ''}`;
}

/** Mismas rutas y parámetros que la web (features/ml/api/mlApi.ts). */
export const RUTAS_ML = {
  demanda: (f: FiltroDemanda) => conQuery('/ml/kpis/demanda', { dias: f.dias, sucursalId: f.sucursalId }),
  noShow: (sucursalId?: string) => conQuery('/ml/kpis/no-show/agenda-hoy', { sucursalId }),
  rfm: () => '/ml/kpis/rfm/segmentos',
  anomalias: (sucursalId?: string) => conQuery('/ml/kpis/anomalias/recientes', { sucursalId }),
  metricas: () => '/ml/modelos/metricas',
};

/** El backend manda algunos centavos como texto ("187000"): se pasan a número una sola vez. */
export function normalizarAnomalias(res: AnomaliasVentasResponse): AnomaliasVentasResponse {
  const num = (v: unknown) => (v === null || v === undefined || v === '' ? undefined : Number(v));
  return {
    ...res,
    monto_sospechoso_cents: Number(res.monto_sospechoso_cents) || 0,
    diagnosticos: (res.diagnosticos ?? []).map((d) => ({
      ...d,
      monto_total_cents: num(d.monto_total_cents),
      descuento_cents: num(d.descuento_cents),
      hora_venta: num(d.hora_venta),
    })),
  };
}
