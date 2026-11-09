import { API_URL, ApiError } from '@/src/lib/api';
import type {
  Ciudad, DisponibilidadSlugDto, PlanDto, RegistrarTiendaDto, RegistroTiendaResponse, TiendaPublica,
} from '../types/saas.types';

/**
 * Rutas globales de la plataforma: van SIN `X-Tenant` ni token (como la web
 * con "ninguno"), así una tienda suspendida no tumba la consulta con 403 y la
 * sesión de otra tienda no se mezcla.
 */
async function apiGlobal<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: { 'Content-Type': 'application/json', ...opciones.headers },
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisá tu conexión a internet.');
  }
  if (!r.ok) {
    const cuerpo = (await r.json().catch(() => null)) as { message?: string | string[]; codigo?: string } | null;
    const mensaje = Array.isArray(cuerpo?.message) ? cuerpo.message.join(', ') : cuerpo?.message;
    throw new ApiError(r.status, mensaje ?? 'Ocurrió un error inesperado', cuerpo?.codigo);
  }
  return r.json() as Promise<T>;
}

export const saasApi = {
  getPlanes: () => apiGlobal<PlanDto[]>('/saas/planes'),
  getTiendas: (limite = 24) => apiGlobal<TiendaPublica[]>(`/saas/tiendas?limite=${limite}`),
  getDisponibilidad: (slug: string) =>
    apiGlobal<DisponibilidadSlugDto>(`/saas/tiendas/disponibilidad?slug=${encodeURIComponent(slug)}`),
  resolverTienda: (slug: string) => apiGlobal<TiendaPublica>(`/saas/tiendas/${encodeURIComponent(slug)}`),
  registrarTienda: (dto: RegistrarTiendaDto) =>
    apiGlobal<RegistroTiendaResponse>('/saas/tiendas', { method: 'POST', body: JSON.stringify(dto) }),
  getCiudades: () => apiGlobal<Ciudad[]>('/sucursales/ciudades'),
};
