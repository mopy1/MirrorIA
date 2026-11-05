// Tipos compartidos entre auth, context y saas (spec Fase 1 §6.1-6.2).

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
}

export type EstadoInquilino = "ACTIVO" | "SUSPENDIDO"
export type EstadoSuscripcion = "TRIAL" | "ACTIVA" | "VENCIDA" | "CANCELADA"
