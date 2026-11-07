import { apiFetch } from "@/lib/api"
import type { PlanDto } from "@/types/plan.types"
import type {
  CobroSuscripcionResponseDto,
  EstadoCobroSuscripcionResponseDto,
  IniciarCobroSuscripcionDto,
  MiSuscripcionDto,
} from "../types/suscripcion.types"

export const suscripcionApi = {
  getMiSuscripcion: () => apiFetch<MiSuscripcionDto>("/saas/mi-suscripcion"),
  cambiarPlan: (planCodigo: string) =>
    apiFetch<MiSuscripcionDto>("/saas/mi-suscripcion/plan", { method: "PATCH", body: JSON.stringify({ planCodigo }) }),
  // Catálogo público de planes para el diálogo de cambio (ruta global 🧭).
  getPlanes: () => apiFetch<PlanDto[]>("/saas/planes", {}, "ninguno"),
  iniciarCobro: (dto: IniciarCobroSuscripcionDto) =>
    apiFetch<CobroSuscripcionResponseDto>("/saas/mi-suscripcion/cobro", {
      method: "POST",
      body: JSON.stringify(dto),
    }),
  estadoCobro: (cobroId: string) =>
    apiFetch<EstadoCobroSuscripcionResponseDto>(`/saas/mi-suscripcion/cobro/${cobroId}/estado`),
  confirmarCobro: (cobroId: string) =>
    apiFetch<EstadoCobroSuscripcionResponseDto>(`/saas/mi-suscripcion/cobro/${cobroId}/confirmar`, {
      method: "POST",
    }),
  simularPago: (cobroId: string) =>
    apiFetch<EstadoCobroSuscripcionResponseDto>(`/saas/mi-suscripcion/cobro/${cobroId}/simular-pago`, {
      method: "POST",
    }),
}
