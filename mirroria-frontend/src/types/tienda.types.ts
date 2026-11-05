// Tipos compartidos entre auth, context y saas (spec Fase 1 §6.1-6.2, Fase 1b §D.6).
import type { MarcaPublica } from "./marca.types"

/** Tienda que viaja en la sesión (`UsuarioResponse.tenant`). */
export interface TenantSesion {
  id: string
  slug: string
  nombre: string
}

/** Tienda pública: `GET /saas/tiendas`, `GET /saas/tiendas/:slug`. */
export interface TiendaPublica {
  id: string
  slug: string
  nombre: string
  /** false → el front muestra "Tienda no disponible" (suspendida o vencida). */
  disponible: boolean
  /** Marca efectiva (Fase 1b). Opcional en el tipo: un backend viejo no la manda y el front cae en la de respaldo. */
  marca?: MarcaPublica
}

export type EstadoInquilino = "ACTIVO" | "SUSPENDIDO"
export type EstadoSuscripcion = "TRIAL" | "ACTIVA" | "VENCIDA" | "CANCELADA"
