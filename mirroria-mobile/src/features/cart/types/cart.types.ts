export interface CarritoItem {
  varianteId: string;
  cantidad: number;
}

export interface CarritoResponseDto {
  id: string;
  usuarioId: string;
  items: CarritoItem[];
}

export interface VentaItemResponseDto {
  id: string;
  varianteId: string;
  cantidad: number;
  precioUnitCents: number;
  subtotalCents: number;
}

export interface VentaResponseDto {
  id: string;
  clienteId: string | null;
  sucursalId: string;
  cajeroId: string | null;
  reservaId: string | null;
  cuponId: string | null;
  canal: string;
  estado: string;
  numeroComprobante: string | null;
  subtotalCents: number;
  descuentoCents: number;
  totalCents: number;
  createdAt: string;
  items: VentaItemResponseDto[];
}

export interface CheckoutCarritoRequest {
  sucursalId: string;
  canal: 'MOVIL';
  codigoCupon?: string;
}
