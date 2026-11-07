import { apiFetch } from '@/lib/api/cliente-http';
import { EP } from '@/lib/api/endpoints';
import type { TiendaDirectorio } from '../types/tienda.types';

/** Directorio público de la plataforma (🧭, sin X-Tenant). */
export const listarTiendas = () => apiFetch<TiendaDirectorio[]>(EP.tiendas, { tenant: false, auth: false });

/** Marca efectiva de una tienda (para refrescar la cacheada). */
export const obtenerTienda = (slug: string) => apiFetch<TiendaDirectorio>(EP.tienda(slug), { tenant: false, auth: false });
