// DTOs de planes y suscripciones (spec Fase 1 §6.1). Compartidos por los
// features saas, subscription y platform: por eso viven acá y no en un feature.
import type { EstadoSuscripcion } from "./tienda.types"

export interface LimitesPlanDto {
  maxSucursales: number | null // null = ilimitado
  maxProductos: number | null
  maxUsuariosStaff: number | null
}

export interface PlanDto {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  precioMensualCents: number // BOB
  precioMensualUsdCents: number // USD
  diasPrueba: number
  orden: number
  activo: boolean
  limites: LimitesPlanDto
}

export interface UsoPlanDto {
  sucursales: number
  productos: number
  usuariosStaff: number
}

export interface SuscripcionDto {
  id: string
  estado: EstadoSuscripcion
  plan: Pick<PlanDto, "id" | "codigo" | "nombre">
  inicio: string
  fin: string
  diasRestantes: number // ceil((fin - now)/día), mínimo 0
  precioCents: number
  proveedorPago: string | null
  referenciaPago: string | null
}
