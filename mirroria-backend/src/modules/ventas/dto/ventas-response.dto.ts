import type { CarritoItem } from '../entities/carrito.entity.js';

export class CarritoResponseDto {
  id!: string;
  usuarioId!: string;
  items!: CarritoItem[];
}

export class VentaItemResponseDto {
  id!: string;
  varianteId!: string;
  cantidad!: number;
  precioUnitCents!: number;
  subtotalCents!: number;
}

export class VentaResponseDto {
  id!: string;
  clienteId!: string | null;
  sucursalId!: string;
  cajeroId!: string | null;
  reservaId!: string | null;
  cuponId!: string | null;
  canal!: string;
  estado!: string;
  numeroComprobante!: string | null;
  subtotalCents!: number;
  descuentoCents!: number;
  totalCents!: number;
  createdAt!: Date;
  items!: VentaItemResponseDto[];
}
