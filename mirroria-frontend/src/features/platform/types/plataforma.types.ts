// Espejo de la spec Fase 1 §6.2 + Fase 1b §D.6 (`/saas/plataforma/*`).
import type { MarcaMini, MarcaPublica, NivelMarca, SeccionMarca } from "@/types/marca.types"
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
  /** Fase 1b: miniatura de la marca y lo que paga hoy (0 si está en prueba). */
  marca?: MarcaMini
  mrrCents?: number
}

export interface InquilinoDetalleDto extends InquilinoResumenDto {
  motivoSuspension: string | null
  limites: LimitesPlanDto
  historial: SuscripcionDto[]
  sucursales: number
  productos: number
  ventasPagadas30d: number
  marcaCompleta?: MarcaPublica
  nivelMarca?: NivelMarca
  actividad?: EventoPlataformaDto[]
}

export type OrdenInquilinos = "recientes" | "por-vencer" | "nombre" | "mrr"

export interface FiltrosInquilinos {
  estado?: EstadoInquilino
  suscripcion?: Exclude<EstadoSuscripcion, "CANCELADA">
  plan?: string
  q?: string
  orden?: OrdenInquilinos
}

export type TipoEvento = "ALTA" | "SUSPENDIDA" | "REACTIVADA" | "PLAN_CAMBIADO" | "VIGENCIA_EXTENDIDA"
  | "MARCA_ACTUALIZADA" | "MARCA_RESTABLECIDA" | "PAGO_REGISTRADO"

export interface EventoPlataformaDto {
  id: string
  tipo: TipoEvento
  detalle: string | null
  actorRol: "PLATAFORMA" | "TIENDA" | "SISTEMA"
  actorEmail: string | null
  tienda: { id: string; nombre: string; slug: string }
  createdAt: string
}

export interface DashboardPlataformaDto {
  tiendas: { total: number; activas: number; enPrueba: number; vencidas: number; suspendidas: number }
  mrrCents: number
  arrCents: number
  mrrPorPlan: { codigo: string; nombre: string; tiendas: number; mrrCents: number }[]
  altasMes: number
  altasMesAnterior: number
  altasPorMes: { mes: string; altas: number }[]
  churn30d: { tasa: number; perdidas: number; base: number }
  conversionPrueba: { tasa: number; convertidas: number; cerradas: number }
  gmv30d: { ventas: number; montoCents: number }
  trialsPorVencer: InquilinoResumenDto[]
  actividad: EventoPlataformaDto[]
}

export interface MetricasTiendaDto {
  ventasMes: { cantidad: number; montoCents: number }
  ventasMesAnterior: { cantidad: number; montoCents: number }
  ticketPromedioCents: number
  productosActivos: number
  usuariosStaff: number
  clientas: number
  sucursalesActivas: number
  reservasMes: number
  ultimaVentaAt: string | null
  ventasPorDia: { fecha: string; cantidad: number; montoCents: number }[]
}

export type { SeccionMarca }

export interface CrearPlanDto {
  codigo: string
  nombre: string
  descripcion?: string
  precioMensualCents: number
  precioMensualUsdCents: number
  diasPrueba?: number
  orden?: number
  limites: LimitesPlanDto
  nivelMarca?: NivelMarca
  destacado?: boolean
}

export type ActualizarPlanDto = Partial<Omit<CrearPlanDto, "codigo">> & { activo?: boolean }
