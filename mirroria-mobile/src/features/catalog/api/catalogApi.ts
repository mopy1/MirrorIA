import { apiFetch } from '@/src/lib/api';
import type {
  ProductoResponseDto,
  CategoriaResponseDto,
} from '../types/catalog.types';

export const catalogApi = {
  /**
   * Obtiene la lista completa de productos activos del catálogo.
   * RF07: Público, no requiere token de sesión.
   */
  async getProductos(): Promise<ProductoResponseDto[]> {
    return apiFetch<ProductoResponseDto[]>('/catalogo/productos');
  },

  /**
   * Obtiene el detalle de un producto por su UUID.
   */
  async getProducto(id: string): Promise<ProductoResponseDto> {
    return apiFetch<ProductoResponseDto>(`/catalogo/productos/${id}`);
  },

  /**
   * Obtiene todas las categorías activas.
   */
  async getCategorias(): Promise<CategoriaResponseDto[]> {
    return apiFetch<CategoriaResponseDto[]>('/catalogo/categorias');
  },
};
