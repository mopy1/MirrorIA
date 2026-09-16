export interface ImagenProducto {
  url: string;
  orden: number;
  esPrincipal: boolean;
}

export interface CategoriaResponseDto {
  id: string;
  nombre: string;
  slug: string;
  padreId: string | null;
  activo: boolean;
}

export interface VarianteResponseDto {
  id: string;
  tallaId: string;
  tallaNombre: string;
  colorId: string;
  colorNombre: string;
  sku: string;
  activo: boolean;
}

export interface ProductoResponseDto {
  id: string;
  categoriaId: string;
  coleccionId: string;
  titulo: string;
  slug: string;
  descripcion: string | null;
  precioCents: number;
  modeloArUrl: string | null;
  imagenes: ImagenProducto[];
  activo: boolean;
  variantes?: VarianteResponseDto[];
}
