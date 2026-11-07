import type { MarcaPublica } from '@/lib/tema/marca.types';

/** `GET /saas/tiendas` (🧭, público). */
export interface TiendaDirectorio {
  id: string;
  slug: string;
  nombre: string;
  disponible: boolean;
  marca: MarcaPublica | null;
}
