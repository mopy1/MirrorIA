// Espejo de los DTOs de mirroria-backend/src/modules/inventario (los mismos que usa la web).

export interface InventarioSucursal {
  id: string;
  varianteId: string;
  sucursalId: string;
  cantidadDisponible: number;
  cantidadReservada: number;
  cantidadEnTransito: number;
}

export type TipoMovimiento = 'RESERVA' | 'LIBERACION_RESERVA' | 'VENTA' | 'DEVOLUCION' | 'RECEPCION_PROVEEDOR' | 'AJUSTE';

export interface MovimientoInventario {
  id: string;
  varianteId: string;
  sucursalId: string;
  tipoMovimiento: TipoMovimiento;
  cantidad: number;
  ordenCompraId: string | null;
  ventaItemId: string | null;
  motivo: string | null;
  referenciaDoc: string | null;
  fecha: string;
}

export interface AjustarStockDto {
  varianteId: string;
  sucursalId: string;
  /** Delta: positivo suma, negativo resta (nunca 0). */
  cantidad: number;
  motivo: string;
}

export type EstadoOrdenCompra = 'PENDIENTE' | 'RECIBIDA_PARCIAL' | 'RECIBIDA' | 'CANCELADA' | 'EN_TRANSITO';

export interface OrdenCompraItem {
  varianteId: string;
  cantidadPedida: number;
  cantidadRecibida: number;
}

export interface OrdenCompra {
  id: string;
  proveedorId: string;
  sucursalDestinoId: string;
  estado: EstadoOrdenCompra;
  items: OrdenCompraItem[];
  fechaPedido: string;
  fechaEsperada: string | null;
  fechaRecepcion: string | null;
}

export interface CreateOrdenCompraDto {
  proveedorId: string;
  sucursalDestinoId: string;
  items: { varianteId: string; cantidadPedida: number }[];
  fechaEsperada?: string;
}

export interface RecibirOrdenCompraDto {
  items: { varianteId: string; cantidadRecibida: number }[];
}

export interface Sucursal {
  id: string;
  ciudadId: string;
  ciudadNombre: string;
  nombre: string;
  direccion: string;
  telefono: string | null;
  activo: boolean;
}

/** El catálogo aplanado a nivel variante (producto + talla + color), igual que useVariantesConProducto de la web. */
export interface VarianteConProducto {
  varianteId: string;
  productoId: string;
  coleccionId: string;
  productoTitulo: string;
  tallaNombre: string;
  colorNombre: string;
  sku: string;
  imagenUrl?: string;
}
