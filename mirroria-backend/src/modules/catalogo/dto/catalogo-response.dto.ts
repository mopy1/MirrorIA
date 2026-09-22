import type { ImagenProducto } from '../entities/producto.entity.js';

export class CategoriaResponseDto {
  id!: string;
  nombre!: string;
  slug!: string;
  padreId!: string | null;
  activo!: boolean;
}

export class TemporadaResponseDto {
  id!: string;
  nombre!: string;
  fechaInicio!: string;
  fechaFin!: string;
  activo!: boolean;
}

export class ColeccionResponseDto {
  id!: string;
  nombre!: string;
  descripcion!: string | null;
  temporadaId!: string;
  proveedorId!: string;
  activo!: boolean;
}

export class TallaResponseDto {
  id!: string;
  nombre!: string;
  orden!: number;
}

export class ColorResponseDto {
  id!: string;
  nombre!: string;
  hexCode!: string | null;
}

export class VarianteResponseDto {
  id!: string;
  tallaId!: string;
  tallaNombre!: string;
  colorId!: string;
  colorNombre!: string;
  sku!: string;
  activo!: boolean;
}

export class ProductoResponseDto {
  id!: string;
  categoriaId!: string;
  coleccionId!: string;
  titulo!: string;
  slug!: string;
  descripcion!: string | null;
  precioCents!: number;
  modeloArUrl!: string | null;
  arOverlayImageUrl!: string | null;
  imagenes!: ImagenProducto[];
  activo!: boolean;
  variantes?: VarianteResponseDto[];
}
