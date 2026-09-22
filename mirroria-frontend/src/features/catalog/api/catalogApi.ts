import { apiFetch } from "@/lib/api"
import type { Categoria, Coleccion, Color, ImagenProducto, Producto, Talla, Temporada, Variante } from "../types/catalog.types"

export interface CreateCategoriaDto {
  nombre: string
  slug: string
  padreId?: string
}

export interface CreateTemporadaDto {
  nombre: string
  fechaInicio: string
  fechaFin: string
}

export interface CreateColeccionDto {
  nombre: string
  descripcion?: string
  temporadaId: string
  proveedorId: string
}

export interface CreateTallaDto {
  nombre: string
  orden?: number
}

export interface CreateColorDto {
  nombre: string
  hexCode?: string
}

export interface CreateProductoDto {
  categoriaId: string
  coleccionId: string
  titulo: string
  slug: string
  descripcion?: string
  precioCents: number
  arOverlayImageUrl?: string | null
  modeloArUrl?: string | null
  imagenes?: ImagenProducto[]
}

export interface UpdateProductoDto {
  categoriaId?: string
  coleccionId?: string
  titulo?: string
  slug?: string
  descripcion?: string
  precioCents?: number
  arOverlayImageUrl?: string | null
  modeloArUrl?: string | null
  imagenes?: ImagenProducto[]
  activo?: boolean
}

export interface CreateVarianteDto {
  tallaId: string
  colorId: string
  sku: string
}

export const catalogApi = {
  getCategorias: () => apiFetch<Categoria[]>("/catalogo/categorias"),
  createCategoria: (dto: CreateCategoriaDto) =>
    apiFetch<Categoria>("/catalogo/categorias", { method: "POST", body: JSON.stringify(dto) }),

  getTemporadas: () => apiFetch<Temporada[]>("/catalogo/temporadas"),
  createTemporada: (dto: CreateTemporadaDto) =>
    apiFetch<Temporada>("/catalogo/temporadas", { method: "POST", body: JSON.stringify(dto) }),

  getColecciones: () => apiFetch<Coleccion[]>("/catalogo/colecciones"),
  createColeccion: (dto: CreateColeccionDto) =>
    apiFetch<Coleccion>("/catalogo/colecciones", { method: "POST", body: JSON.stringify(dto) }),

  getTallas: () => apiFetch<Talla[]>("/catalogo/tallas"),
  createTalla: (dto: CreateTallaDto) =>
    apiFetch<Talla>("/catalogo/tallas", { method: "POST", body: JSON.stringify(dto) }),

  getColores: () => apiFetch<Color[]>("/catalogo/colores"),
  createColor: (dto: CreateColorDto) =>
    apiFetch<Color>("/catalogo/colores", { method: "POST", body: JSON.stringify(dto) }),

  // Listado liviano (sin variantes anidadas) — suficiente para una grilla.
  getProductos: () => apiFetch<Producto[]>("/catalogo/productos"),
  createProducto: (dto: CreateProductoDto) =>
    apiFetch<Producto>("/catalogo/productos", { method: "POST", body: JSON.stringify(dto) }),
  updateProducto: (id: string, dto: UpdateProductoDto) =>
    apiFetch<Producto>(`/catalogo/productos/${id}`, { method: "PATCH", body: JSON.stringify(dto) }),

  getProducto: (id: string) => apiFetch<Producto>(`/catalogo/productos/${id}`),
  createVariante: (productoId: string, dto: CreateVarianteDto) =>
    apiFetch<Variante>(`/catalogo/productos/${productoId}/variantes`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),
}
