// Espejo de los DTO del backend que usa el equipo de la tienda (ventas, pagos, reservas).

export interface VentaItem {
  id: string;
  varianteId: string;
  cantidad: number;
  precioUnitCents: number;
  subtotalCents: number;
}

export interface Venta {
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
  items: VentaItem[];
}

export type MetodoPago = 'TARJETA' | 'QR' | 'EFECTIVO' | 'PAYPAL' | 'BILLETERA';

export interface Pago {
  id: string;
  ventaId: string;
  proveedorPago: string;
  metodo: MetodoPago;
  montoCents: number;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'REEMBOLSADO';
  referenciaExterna: string | null;
  createdAt: string;
}

export interface Reserva {
  id: string;
  clienteId: string;
  sucursalId: string;
  estado: string;
  fechaHoraPrevista: string;
  createdAt: string;
  items: { id: string; varianteId: string; cantidad: number }[];
}

export interface SucursalStaff {
  id: string;
  nombre: string;
  ciudadNombre?: string;
}
