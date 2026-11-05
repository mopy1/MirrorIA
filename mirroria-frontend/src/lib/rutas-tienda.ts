/** Slug de la tienda demo: destino de las rutas viejas sin sesión. */
export const SLUG_DEMO = "tiendaria"

/**
 * `rutaTienda("boutique-lila", "/carrito")` → `/t/boutique-lila/carrito`.
 * `"/"` (o `""`) es el inicio de la tienda. Sin slug devuelve la ruta tal cual
 * (componentes compartidos montados fuera de `/t/:slug`).
 */
export function rutaTienda(slug: string | null | undefined, path: string): string {
  if (!slug) return path || "/"
  const limpio = path === "/" || path === "" ? "" : path.startsWith("/") || path.startsWith("?") ? path : `/${path}`
  return `/t/${slug}${limpio}`
}

/**
 * Traduce una ruta vieja (pre multi-tenant) a la nueva dentro de una tienda,
 * conservando la query string: `/register` pasó a `/registro`.
 */
export function rutaLegacy(slug: string, pathname: string, search = ""): string {
  const path = pathname === "/register" ? "/registro" : pathname
  return `${rutaTienda(slug, path)}${search}`
}
