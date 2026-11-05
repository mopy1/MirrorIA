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
  pagoDisponible: boolean // true en Fase 2
}

export interface IniciarCobroSuscripcionDto {
  pasarela: "WAYRA" | "STRIPE" | "PAYPAL" | "QR_BANCARIO"
  planCodigo?: string
}

export interface CobroSuscripcionResponseDto {
  cobroId: string
  pasarela: string
  modo: "REDIRECT" | "QR" | "INSTRUCCIONES"
  montoCents: number
  url?: string
  qrBase64?: string
  token?: string
  expiraEn?: string
  instrucciones?: string
}

export interface EstadoCobroSuscripcionResponseDto {
  cobroId: string
  estado: "PENDIENTE" | "APROBADO" | "RECHAZADO" | "EXPIRADO"
  pagado: boolean
  pagadoEn?: string
}

