import { API_URL, ApiError, apiFetch, tiendaActual } from '@/src/lib/api';
import { storage } from '@/src/lib/storage';
import { RUTA_EXPORTAR, type PayloadExportacion } from '../lib/archivo';
import type { Ficha, FormatoReporte, Reporte, ReporteHibridoResponse } from '../types/reports.types';

/** Mismos endpoints que la web (`mirroria-frontend/src/features/reports/api/reportsApi.ts`). */
export const reportsApi = {
  /** Reporte en lenguaje natural (agente IA). 503 con mensaje claro si no hay clave de IA. */
  preguntarHibrido: (prompt: string) =>
    apiFetch<ReporteHibridoResponse>('/ia/reportes/hibrido', { method: 'POST', body: JSON.stringify({ prompt }) }),

  /** Ficha armada a mano: anda sin clave de IA. */
  consultar: (ficha: Partial<Ficha>) =>
    apiFetch<Reporte>('/ia/reportes/consulta', { method: 'POST', body: JSON.stringify(ficha) }),

  /** Pide el Excel o el PDF; devuelve los bytes (apiFetch parsea JSON, por eso va con fetch propio). */
  async exportar(formato: FormatoReporte, payload: PayloadExportacion): Promise<ArrayBuffer> {
    const token = await storage.getItem('mirroria_token');
    let res: Response;
    try {
      res = await fetch(`${API_URL}${RUTA_EXPORTAR[formato]}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': tiendaActual(),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new ApiError(0, 'No me pude conectar con el servidor. Revisá tu conexión y probá de nuevo.');
    }
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
      const msg = err?.message || `No se pudo generar el ${formato === 'pdf' ? 'PDF' : 'Excel'}.`;
      throw new ApiError(res.status, Array.isArray(msg) ? msg.join(', ') : msg);
    }
    return res.arrayBuffer();
  },
};
