export type PeriodoDashboard = "hoy" | "7d" | "30d" | "mes_actual" | "mes_anterior" | "personalizado"

export interface FiltroDashboardEjecutivo {
  periodo?: PeriodoDashboard
  fechaInicio?: string
  fechaFin?: string
  sucursalId?: string
}

export interface FiltroDashboardOperativo {
  sucursalId?: string
}

export interface PeriodoResumenDto {
  clave: string
  desde: string
  hasta: string
  sucursalId: string | null
  sucursalNombre: string
}

export interface KpiMontoDto {
  montoCents: number
  montoBs: number
  anteriorMontoCents: number
  variacionPorcentaje: number
  tendencia: "POSITIVA" | "NEGATIVA" | "NEUTRA"
}

export interface KpiRotacionDto {
  ratio: number
  unidadesVendidas: number
  stockTotalDisponible: number
  interpretacion: "SALUDABLE" | "ALTA" | "LENTA"
}

export interface KpiConversionDto {
  tasaPorcentaje: number
  reservasConVenta: number
  totalReservasCerradas: number
  variacionPorcentaje: number
}

export interface KpiClientesActivosDto {
  cantidad: number
  anteriorCantidad: number
  variacionPorcentaje: number
}

export interface KpisEjecutivosDto {
  ingresos: KpiMontoDto
  ticketPromedio: KpiMontoDto
  rotacionInventario: KpiRotacionDto
  conversionReservas: KpiConversionDto
  clientesActivos: KpiClientesActivosDto
}

export interface TendenciaIngresoDiaDto {
  fecha: string
  ingresosBs: number
  ventas: number
}

export interface DistribucionPagoDto {
  proveedor: string
  metodo: string
  montoBs: number
  porcentaje: number
  transacciones: number
}

export interface TopPrendaDto {
  productoId: string
  nombre: string
  categoria: string
  imagenUrl: string | null
  unidadesVendidas: number
  ingresosBs: number
}

export interface TopProveedorDto {
  proveedorId: string
  nombre: string
  ingresosBs: number
  unidadesVendidas: number
  porcentaje: number
}

export interface GraficosEjecutivosDto {
  tendenciaIngresos: TendenciaIngresoDiaDto[]
  distribucionPagos: DistribucionPagoDto[]
  topPrendas: TopPrendaDto[]
  topProveedores: TopProveedorDto[]
}

export interface LimiteRecursoPlanDto {
  actual: number
  maximo: number | null
  porcentaje: number | null
}

export interface PlanSaaSEjecutivoDto {
  planNombre: string
  nivelMarca: string
  diasRestantes: number
  limites: {
    productos: LimiteRecursoPlanDto
    sucursales: LimiteRecursoPlanDto
    usuariosStaff: LimiteRecursoPlanDto
  }
}

export interface DashboardEjecutivoDto {
  periodo: PeriodoResumenDto
  kpis: KpisEjecutivosDto
  graficos: GraficosEjecutivosDto
  planSaaS: PlanSaaSEjecutivoDto
}

export interface SucursalResumenDto {
  id: string
  nombre: string
  ciudad: string
}

export interface KpisHoyVentasDto {
  montoCents: number
  montoBs: number
  cantidadTickets: number
  ticketPromedioBs: number
}

export interface KpisHoyCobrosPendientesDto {
  cantidad: number
  montoEstimadoBs: number
}

export interface KpisHoyReservasDto {
  totalHoy: number
  porLlegar: number
  enTienda: number
  completadas: number
}

export interface KpisHoyStockDto {
  criticos: number
  agotados: number
}

export interface KpisOperativoDto {
  ventas: KpisHoyVentasDto
  cobrosPendientes: KpisHoyCobrosPendientesDto
  reservas: KpisHoyReservasDto
  stock: KpisHoyStockDto
}

export interface PrendaReservaDto {
  nombre: string
  talla: string
  color: string
  cantidad: number
}

export interface ClienteReservaDto {
  id: string
  nombre: string
  telefono: string | null
}

export interface ReservaHoyItemDto {
  reservaId: string
  horaPrevista: string
  estado: string
  cliente: ClienteReservaDto
  prendas: PrendaReservaDto[]
  minutosParaCita: number
}

export interface AlertaStockItemDto {
  inventarioId: string
  productoId: string
  productoNombre: string
  talla: string
  color: string
  stockDisponible: number
  nivel: "AGOTADO" | "CRITICO"
}

export interface DashboardOperativoDto {
  fecha: string
  sucursal: SucursalResumenDto
  kpisHoy: KpisOperativoDto
  reservasHoy: ReservaHoyItemDto[]
  alertasStock: AlertaStockItemDto[]
}
