// Espejo de la spec Fase 1 §6.2 (`/saas/plataforma/*`).
import type { LimitesPlanDto, PlanDto, SuscripcionDto, UsoPlanDto } from "@/types/plan.types"
import type { EstadoInquilino, EstadoSuscripcion } from "@/types/tienda.types"

export type { LimitesPlanDto, PlanDto, SuscripcionDto, UsoPlanDto } from "@/types/plan.types"
export type { EstadoInquilino, EstadoSuscripcion } from "@/types/tienda.types"

export interface InquilinoResumenDto {
  id: string
  nombre: string
  slug: string
  estado: EstadoInquilino
  disponible: boolean
  plan: Pick<PlanDto, "codigo" | "nombre">
  suscripcion: Pick<SuscripcionDto, "estado" | "fin" | "diasRestantes">
  propietario: { fullName: string; email: string } | null
  uso: UsoPlanDto
  createdAt: string
}

export interface InquilinoDetalleDto extends InquilinoResumenDto {
  motivoSuspension: string | null
  limites: LimitesPlanDto
  historial: SuscripcionDto[]
  sucursales: number
  productos: number
  ventasPagadas30d: number
}

export interface ResumenPlataformaDto {
  inquilinos: { total: number; activos: number; suspendidos: number; enTrial: number; vencidos: number }
  mrrCents: number
  altasUltimos30Dias: number
  trialsPorVencer: InquilinoResumenDto[]
}

export interface FiltrosInquilinos {
  estado?: EstadoInquilino
  suscripcion?: Exclude<EstadoSuscripcion, "CANCELADA">
  q?: string
}

export interface CrearPlanDto {
  codigo: string
  nombre: string
  descripcion?: string
  precioMensualCents: number
  precioMensualUsdCents: number
  diasPrueba?: number
  orden?: number
  limites: LimitesPlanDto
}

export type ActualizarPlanDto = Partial<Omit<CrearPlanDto, "codigo">> & { activo?: boolean }
