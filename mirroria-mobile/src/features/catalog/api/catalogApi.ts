import { apiFetch, tiendaActual } from '@/src/lib/api';
import { conCatalogoLocal } from '@/src/lib/offline/catalogoLocal';
import { baseLocal } from '@/src/lib/offline/expoBase';
import type {
  ProductoResponseDto,
  CategoriaResponseDto,
} from '../types/catalog.types';

/** Sin red se sirve desde SQLite lo último guardado de la tienda. */
async function conCache<T>(clave: string, traer: () => Promise<T>): Promise<T> {
  return conCatalogoLocal(await baseLocal(), tiendaActual(), clave, traer);
}

export const catalogApi = {
  /**
   * Obtiene la lista completa de productos activos del catálogo.
   * RF07: Público, no requiere token de sesión.
   */
  async getProductos(): Promise<ProductoResponseDto[]> {
    return conCache('productos', () => apiFetch<ProductoResponseDto[]>('/catalogo/productos'));
  },

  /**
   * Obtiene el detalle de un producto por su UUID.
   */
  async getProducto(id: string): Promise<ProductoResponseDto> {
    return conCache(`producto:${id}`, () => apiFetch<ProductoResponseDto>(`/catalogo/productos/${id}`));
  },

  /**
   * Obtiene todas las categorías activas.
   */
  async getCategorias(): Promise<CategoriaResponseDto[]> {
    return conCache('categorias', () => apiFetch<CategoriaResponseDto[]>('/catalogo/categorias'));
  },
};
