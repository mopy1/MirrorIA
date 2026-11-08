import { API_URL, ApiError, apiFetch, tiendaActual } from '@/src/lib/api';
import { storage } from '@/src/lib/storage';
import { esFallback, normalizarAnomalias, RUTAS_ML } from '../lib/ml-consultas';
import type {
  AnomaliasVentasResponse,
  DemandaMlResponse,
  FiltroDemanda,
  MetricasModelosResponse,
  NoShowAgendaResponse,
  RfmSegmentosResponse,
} from '../types/ml.types';

export interface RespuestaMl<T> {
  data: T;
  /** true si vino la estimación de respaldo (cabecera X-ML-Fallback o bandera del cuerpo). */
  fallback: boolean;
}

/**
 * Como `apiFetch` pero devuelve también la cabecera `X-ML-Fallback`. Mismas cabeceras (X-Tenant,
 * Bearer). Ante un 401 delega en `apiFetch`, que limpia la sesión y avisa como en el resto de la app.
 */
async function apiFetchMl<T>(ruta: string): Promise<RespuestaMl<T>> {
  const token = await storage.getItem('mirroria_token');
  let res: Response;
  try {
    res = await fetch(`${API_URL}${ruta}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': tiendaActual(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar al servidor. Revisá tu conexión.');
  }
  if (res.status === 401) {
    const data = await apiFetch<T>(ruta);
    return { data, fallback: esFallback(null, data) };
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string | string[]; codigo?: string } | null;
    const msg = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new ApiError(res.status, msg ?? 'Ocurrió un error inesperado', body?.codigo);
  }
  const data = (await res.json()) as T;
  return { data, fallback: esFallback(res.headers.get('X-ML-Fallback'), data) };
}

/** Mismos endpoints que la web (features/ml/api/mlApi.ts). */
export const mlApi = {
  demanda: (f: FiltroDemanda) => apiFetchMl<DemandaMlResponse>(RUTAS_ML.demanda(f)),
  noShow: (sucursalId?: string) => apiFetchMl<NoShowAgendaResponse>(RUTAS_ML.noShow(sucursalId)),
  rfm: () => apiFetchMl<RfmSegmentosResponse>(RUTAS_ML.rfm()),
  anomalias: async (sucursalId?: string) => {
    const r = await apiFetchMl<AnomaliasVentasResponse>(RUTAS_ML.anomalias(sucursalId));
    return { ...r, data: normalizarAnomalias(r.data) };
  },
  metricas: () => apiFetchMl<MetricasModelosResponse>(RUTAS_ML.metricas()),
  /** id → nombre de la prenda (la demanda a veces trae solo el id). */
  nombresPrendas: async (): Promise<Record<string, string>> => {
    const lista = await apiFetch<{ id: string; titulo: string }[] | { items?: { id: string; titulo: string }[] }>(
      '/catalogo/productos'
    );
    const items = Array.isArray(lista) ? lista : (lista.items ?? []);
    return Object.fromEntries(items.map((p) => [p.id, p.titulo]));
  },
};
