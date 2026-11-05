import { apiFetch } from "@/lib/api"
import type { PlanDto } from "@/types/plan.types"
import type { MiSuscripcionDto } from "../types/suscripcion.types"

export const suscripcionApi = {
  getMiSuscripcion: () => apiFetch<MiSuscripcionDto>("/saas/mi-suscripcion"),
  cambiarPlan: (planCodigo: string) =>
    apiFetch<MiSuscripcionDto>("/saas/mi-suscripcion/plan", { method: "PATCH", body: JSON.stringify({ planCodigo }) }),
  // Catálogo público de planes para el diálogo de cambio (ruta global 🧭).
  getPlanes: () => apiFetch<PlanDto[]>("/saas/planes", {}, "ninguno"),
}
