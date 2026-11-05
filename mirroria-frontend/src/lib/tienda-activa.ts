/**
 * Slug de la tienda que se está navegando (`/t/:slug/*`). Vive fuera de React
 * a propósito: `apiFetch` lo lee en cada request para mandar `X-Tenant`, y lo
 * fija `TenantProvider` en el render (idempotente), así el primer fetch de los
 * hijos ya sale con la cabecera.
 */
let tiendaActiva: string | null = null

export function getTiendaActiva(): string | null {
  return tiendaActiva
}

export function setTiendaActiva(slug: string | null): void {
  tiendaActiva = slug
}
