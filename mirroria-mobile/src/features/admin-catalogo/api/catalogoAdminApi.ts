import { apiFetch } from '@/src/lib/api';
import type {
  Categoria,
  Coleccion,
  Color,
  CreateProductoDto,
  CreateVarianteDto,
  Producto,
  Talla,
  Temporada,
  UpdateProductoDto,
  UsoPlan,
  Variante,
} from '../types/catalogo-admin.types';

interface MiSuscripcion {
  plan: { nombre: string; limites: { maxProductos: number | null } };
  uso: { productos: number };
}

const json = (body: unknown) => JSON.stringify(body);

/** Mismos endpoints que el panel web (catalogApi de mirroria-frontend). */
export const catalogoAdminApi = {
  getProductos: () => apiFetch<Producto[]>('/catalogo/productos'),
  // El ADMIN también ve una prenda desactivada (al resto le da 404).
  getProducto: (id: string) => apiFetch<Producto>(`/catalogo/productos/${id}`),
  createProducto: (dto: CreateProductoDto) => apiFetch<Producto>('/catalogo/productos', { method: 'POST', body: json(dto) }),
  updateProducto: (id: string, dto: UpdateProductoDto) =>
    apiFetch<Producto>(`/catalogo/productos/${id}`, { method: 'PATCH', body: json(dto) }),
  createVariante: (productoId: string, dto: CreateVarianteDto) =>
    apiFetch<Variante>(`/catalogo/productos/${productoId}/variantes`, { method: 'POST', body: json(dto) }),

  getCategorias: () => apiFetch<Categoria[]>('/catalogo/categorias'),
  getColecciones: () => apiFetch<Coleccion[]>('/catalogo/colecciones'),
  getTemporadas: () => apiFetch<Temporada[]>('/catalogo/temporadas'),
  getTallas: () => apiFetch<Talla[]>('/catalogo/tallas'),
  getColores: () => apiFetch<Color[]>('/catalogo/colores'),

  async getUsoPlan(): Promise<UsoPlan> {
    const s = await apiFetch<MiSuscripcion>('/saas/mi-suscripcion');
    return { planNombre: s.plan.nombre, maxProductos: s.plan.limites.maxProductos, productosActivos: s.uso.productos };
  },
};
