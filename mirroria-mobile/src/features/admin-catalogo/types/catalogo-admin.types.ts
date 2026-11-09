// Espejo de los DTOs de mirroria-backend/src/modules/catalogo (mismos que usa la web en el panel).

export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  padreId: string | null;
  activo: boolean;
}

export interface Temporada {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
}

export interface Coleccion {
  id: string;
  nombre: string;
  descripcion: string | null;
  temporadaId: string;
  proveedorId: string;
  activo: boolean;
}

export interface Talla {
  id: string;
  nombre: string;
  orden: number;
}

export interface Color {
  id: string;
  nombre: string;
  hexCode: string | null;
}

export interface Variante {
  id: string;
  tallaId: string;
  tallaNombre: string;
  colorId: string;
  colorNombre: string;
  sku: string;
  activo: boolean;
}

export interface ImagenProducto {
  url: string;
  varianteId?: string;
  orden: number;
}

export interface Producto {
  id: string;
  categoriaId: string;
  coleccionId: string;
  titulo: string;
  slug: string;
  descripcion: string | null;
  precioCents: number;
  imagenes: ImagenProducto[];
  activo: boolean;
  variantes?: Variante[];
}

export interface CreateProductoDto {
  categoriaId: string;
  coleccionId: string;
  titulo: string;
  slug: string;
  descripcion?: string;
  precioCents: number;
  imagenes?: ImagenProducto[];
}

export type UpdateProductoDto = Partial<CreateProductoDto> & { activo?: boolean };

export interface CreateVarianteDto {
  tallaId: string;
  colorId: string;
  sku: string;
}

/** Lo que usa el catálogo del panel de GET /saas/mi-suscripcion (solo ADMIN). */
export interface UsoPlan {
  planNombre: string;
  maxProductos: number | null;
  productosActivos: number;
}
