import { apiFetch } from "@/lib/api"
import type { ContextoPasarela, PasarelaMetadata } from "../types/pasarelas.types"

export const pasarelasApi = {
  getPasarelas: (contexto?: ContextoPasarela) => {
    const query = contexto ? `?contexto=${contexto}` : ""
    return apiFetch<PasarelaMetadata[]>(`/pagos/pasarelas${query}`)
  },
}
