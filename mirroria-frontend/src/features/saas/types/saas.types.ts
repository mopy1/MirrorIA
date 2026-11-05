// Espejo de los contratos de la spec Fase 1 §6 (módulo `saas` del backend).
import type { AuthResponse } from "@/features/auth/types/auth.types"
import type { SuscripcionDto } from "@/types/plan.types"
import type { TiendaPublica } from "@/types/tienda.types"

// Compartidos con subscription/platform: viven en src/types (un feature no importa a otro).
export type { EstadoInquilino, EstadoSuscripcion, TiendaPublica } from "@/types/tienda.types"
export type { LimitesPlanDto, PlanDto, SuscripcionDto, UsoPlanDto } from "@/types/plan.types"

export interface DisponibilidadSlugDto {
  slug: string
  disponible: boolean
  motivo: "FORMATO" | "RESERVADO" | "OCUPADO" | null
}

export interface RegistrarTiendaDto {
  planCodigo: string
  tienda: { nombre: string; slug: string }
  sucursal: { nombre: string; direccion: string; ciudadId: string; telefono?: string }
  admin: { fullName: string; email: string; password: string }
}

export interface RegistroTiendaResponse extends AuthResponse {
  tienda: TiendaPublica
  suscripcion: SuscripcionDto
  sucursalId: string
}
