import type { PlanDto, SuscripcionDto, UsoPlanDto } from "@/types/plan.types"
import type { TiendaPublica } from "@/types/tienda.types"

export type { PlanDto, SuscripcionDto, UsoPlanDto } from "@/types/plan.types"

/** `GET /saas/mi-suscripcion` (spec §6.2). */
export interface MiSuscripcionDto {
  tienda: TiendaPublica
  plan: PlanDto
  suscripcion: SuscripcionDto // la más reciente
  uso: UsoPlanDto
  historial: SuscripcionDto[] // más nuevas primero
  puedeCambiarPlan: boolean // estado === 'TRIAL'
  pagoDisponible: false // Fase 2 lo pone en true
}
