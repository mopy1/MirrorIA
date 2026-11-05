import { apiFetch } from "@/lib/api"
import type { ActualizarMarcaDto, MiMarcaDto, SeccionMarca } from "@/types/marca.types"
import type { ProductoCatalogoMini } from "../types/apariencia.types"

// Rutas del ADMIN de la tienda del JWT (spec Fase 1b §D.6): no llevan id, el tenant sale de la sesión.
export const aparienciaApi = {
  getMiMarca: () => apiFetch<MiMarcaDto>("/saas/mi-marca"),
  guardar: (dto: ActualizarMarcaDto) => apiFetch<MiMarcaDto>("/saas/mi-marca", { method: "PUT", body: JSON.stringify(dto) }),
  restablecer: (seccion: SeccionMarca) =>
    apiFetch<MiMarcaDto>("/saas/mi-marca/restablecer", { method: "POST", body: JSON.stringify({ seccion }) }),
  // Las prendas reales de la tienda para la vista previa (solo nombre, precio y foto).
  productos: () => apiFetch<ProductoCatalogoMini[]>("/catalogo/productos"),
}
