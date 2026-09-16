export type TipoDescuentoCupon = "PORCENTAJE" | "MONTO_FIJO"

export interface Cupon {
  id: string
  codigo: string
  tipoDescuento: TipoDescuentoCupon
  valor: number
  fechaInicio: string
  fechaFin: string
  usosMaximos: number | null
  usosActuales: number
  montoMinimoCents: number | null
  activo: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCuponDto {
  codigo: string
  tipoDescuento: TipoDescuentoCupon
  valor: number
  fechaInicio: string
  fechaFin: string
  usosMaximos?: number | null
  montoMinimoCents?: number | null
  activo?: boolean
}

export interface ValidarCuponResult {
  valido: boolean
  mensaje?: string
  cupon?: Cupon
  descuentoCents: number
  totalConDescuentoCents: number
}
