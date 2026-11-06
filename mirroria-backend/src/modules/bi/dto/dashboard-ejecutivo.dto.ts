export interface PeriodoResumenDto {
  clave: string;
  desde: string;
  hasta: string;
  sucursalId: string | null;
  sucursalNombre: string;
}

export interface KpiMontoDto {
  montoCents: number;
  montoBs: number;
  anteriorMontoCents: number;
  variacionPorcentaje: number;
  tendencia: 'POSITIVA' | 'NEGATIVA' | 'NEUTRA';
}

export interface KpiRotacionDto {
  ratio: number;
  unidadesVendidas: number;
  stockTotalDisponible: number;
  interpretacion: 'SALUDABLE' | 'ALTA' | 'LENTA';
}

export interface KpiConversionDto {
  tasaPorcentaje: number;
  reservasConVenta: number;
  totalReservasCerradas: number;
  variacionPorcentaje: number;
}

export interface KpiClientesActivosDto {
  cantidad: number;
  anteriorCantidad: number;
  variacionPorcentaje: number;
}

export interface KpisEjecutivosDto {
  ingresos: KpiMontoDto;
  ticketPromedio: KpiMontoDto;
  rotacionInventario: KpiRotacionDto;
  conversionReservas: KpiConversionDto;
  clientesActivos: KpiClientesActivosDto;
}

export interface TendenciaIngresoDiaDto {
  fecha: string;
  ingresosBs: number;
  ventas: number;
}

export interface DistribucionPagoDto {
  proveedor: string;
  metodo: string;
  montoBs: number;
  porcentaje: number;
  transacciones: number;
}

export interface TopPrendaDto {
  productoId: string;
  nombre: string;
  categoria: string;
  imagenUrl: string | null;
  unidadesVendidas: number;
  ingresosBs: number;
}

export interface TopProveedorDto {
  proveedorId: string;
  nombre: string;
  ingresosBs: number;
  unidadesVendidas: number;
  porcentaje: number;
}

export interface GraficosEjecutivosDto {
  tendenciaIngresos: TendenciaIngresoDiaDto[];
  distribucionPagos: DistribucionPagoDto[];
  topPrendas: TopPrendaDto[];
  topProveedores: TopProveedorDto[];
}

export interface LimiteRecursoPlanDto {
  actual: number;
  maximo: number | null;
  porcentaje: number | null;
}

export interface PlanSaaSEjecutivoDto {
  planNombre: string;
  nivelMarca: string;
  diasRestantes: number;
  limites: {
    productos: LimiteRecursoPlanDto;
    sucursales: LimiteRecursoPlanDto;
    usuariosStaff: LimiteRecursoPlanDto;
  };
}

export interface DashboardEjecutivoResponseDto {
  periodo: PeriodoResumenDto;
  kpis: KpisEjecutivosDto;
  graficos: GraficosEjecutivosDto;
  planSaaS: PlanSaaSEjecutivoDto;
}
