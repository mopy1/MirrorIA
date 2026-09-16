import type { OrdenCompraItem } from '../entities/orden-compra.entity.js';

export class InventarioSucursalResponseDto {
  id!: string;
  varianteId!: string;
  sucursalId!: string;
  cantidadDisponible!: number;
  cantidadReservada!: number;
  cantidadEnTransito!: number;
}

export class MovimientoInventarioResponseDto {
  id!: string;
  varianteId!: string;
  sucursalId!: string;
  tipoMovimiento!: string;
  cantidad!: number;
  ordenCompraId!: string | null;
  ventaItemId!: string | null;
  motivo!: string | null;
  referenciaDoc!: string | null;
  usuarioId!: string | null;
  fecha!: Date;
}

export class OrdenCompraResponseDto {
  id!: string;
  proveedorId!: string;
  sucursalDestinoId!: string;
  usuarioId!: string;
  estado!: string;
  items!: OrdenCompraItem[];
  fechaPedido!: Date;
  fechaEsperada!: string | null;
  fechaRecepcion!: Date | null;
}
