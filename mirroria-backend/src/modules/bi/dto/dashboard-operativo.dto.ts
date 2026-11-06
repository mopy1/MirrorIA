export interface SucursalResumenDto {
  id: string;
  nombre: string;
  ciudad: string;
}

export interface KpisHoyVentasDto {
  montoCents: number;
  montoBs: number;
  cantidadTickets: number;
  ticketPromedioBs: number;
}

export interface KpisHoyCobrosPendientesDto {
  cantidad: number;
  montoEstimadoBs: number;
}

export interface KpisHoyReservasDto {
  totalHoy: number;
  porLlegar: number;
  enTienda: number;
  completadas: number;
}

export interface KpisHoyStockDto {
  criticos: number;
  agotados: number;
}

export interface KpisOperativoDto {
  ventas: KpisHoyVentasDto;
  cobrosPendientes: KpisHoyCobrosPendientesDto;
  reservas: KpisHoyReservasDto;
  stock: KpisHoyStockDto;
}

export interface PrendaReservaDto {
  nombre: string;
  talla: string;
  color: string;
  cantidad: number;
}

export interface ClienteReservaDto {
  id: string;
  nombre: string;
  telefono: string | null;
}

export interface ReservaHoyItemDto {
  reservaId: string;
  horaPrevista: string;
  estado: string;
  cliente: ClienteReservaDto;
  prendas: PrendaReservaDto[];
  minutosParaCita: number;
}

export interface AlertaStockItemDto {
  inventarioId: string;
  productoId: string;
  productoNombre: string;
  talla: string;
  color: string;
  stockDisponible: number;
  nivel: 'AGOTADO' | 'CRITICO';
}

export interface DashboardOperativoResponseDto {
  fecha: string;
  sucursal: SucursalResumenDto;
  kpisHoy: KpisOperativoDto;
  reservasHoy: ReservaHoyItemDto[];
  alertasStock: AlertaStockItemDto[];
}
