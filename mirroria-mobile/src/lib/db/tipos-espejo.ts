// DTOs del backend que baja el espejo (verificados en mirroria-backend, spec §6)
// y los modelos que la UI lee de SQLite.

export interface VarianteDto {
  id: string;
  tallaId: string;
  tallaNombre: string;
  colorId: string;
  colorNombre: string;
  colorHex: string | null;
  sku: string;
  activo: boolean;
}

export interface ImagenProductoDto {
  url: string;
  varianteId?: string | null;
  orden: number;
}

export interface ProductoDto {
  id: string;
  categoriaId: string | null;
  coleccionId: string | null;
  titulo: string;
  slug: string;
  descripcion: string | null;
  precioCents: number;
  imagenes: ImagenProductoDto[];
  activo: boolean;
  variantes?: VarianteDto[];
}

export interface SucursalDto {
  id: string;
  ciudadId: string;
  ciudadNombre: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  activo: boolean;
}

export interface InventarioDto {
  id: string;
  varianteId: string;
  sucursalId: string;
  cantidadDisponible: number;
  cantidadReservada: number;
  cantidadEnTransito: number;
}

export interface CategoriaDto {
  id: string;
  nombre: string;
  slug: string;
  padreId: string | null;
}

export interface TallaDto {
  id: string;
  nombre: string;
  orden: number;
}

export interface CarritoDto {
  id: string;
  usuarioId: string;
  items: { varianteId: string; cantidad: number }[];
}

/** Todo lo que se reemplaza de una vez en SQLite (spec §4.3). */
export interface SnapshotEspejo {
  sucursales: SucursalDto[];
  productos: ProductoDto[];
  inventario: InventarioDto[];
  categorias: CategoriaDto[];
  tallas: TallaDto[];
  carrito: { usuarioId: string; dto: CarritoDto } | null;
}

// ---- Modelos de lectura (UI) ----------------------------------------------

export interface PrendaVitrina {
  id: string;
  nombre: string;
  precioCents: number;
  categoria: string | null;
  imagen: string | null;
  libre: number;
  colores: string[];
}

export interface StockSucursal {
  sucursalId: string;
  sucursalNombre: string;
  ciudad: string;
  libre: number;
}

export interface VarianteFicha {
  id: string;
  sku: string;
  talla: string;
  tallaOrden: number;
  color: string;
  colorHex: string | null;
  stock: StockSucursal[];
}

export interface FichaPrenda {
  producto: ProductoDto;
  categoria: string | null;
  variantes: VarianteFicha[];
  guardadoEn: number;
}

export interface EstadoEspejo {
  prendas: number;
  ultimoSync: number | null;
}
