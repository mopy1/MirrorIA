/**
 * La carpeta que este frontend sirve con los recortes del probador. Es la
 * misma en tres lados: `public/prendas/` en el repo, la URL que escribe
 * `scripts/sembrar-catalogo.mjs`, y la regla de `nginx.conf` que evita que un
 * archivo faltante se conteste con index.html.
 */
export const RUTA_DE_RECORTES = "/prendas/"

/**
 * Resuelve la URL del recorte de una prenda contra el origen que está
 * sirviendo la app.
 *
 * Por qué hace falta: en la base la URL se guarda ABSOLUTA
 * (`https://mirroria.duckdns.org/prendas/<slug>.png`) y tiene que seguir así,
 * porque el móvil usa ese mismo campo como `{ uri }` de React Native y ahí no
 * hay ningún origen contra el cual resolver una ruta relativa. Pero los
 * recortes son archivos que ESTE frontend trae en `public/`, y una URL
 * absoluta manda al navegador a un dominio que puede no tenerlos todavía: es
 * exactamente lo que pasaba en desarrollo (el dev server tenía los PNG y el
 * navegador se iba igual a producción) y en producción mientras esta rama no
 * esté desplegada.
 *
 * Peor aún, el fallo era invisible: nginx contesta `index.html` con **200**
 * para lo que no encuentra, así que el `<img>` recibía HTML y sólo se veía
 * «esa prenda no se pudo cargar», como si fuera culpa de esa prenda.
 *
 * Regla: si el pathname cae dentro de la carpeta que servimos, la prenda es
 * nuestra y se pide a nuestro propio origen. Cualquier otra URL —un overlay
 * que un admin subió a un CDN— se respeta tal cual, porque reescribirla la
 * rompería. Lo que no se puede interpretar se devuelve intacto, para que
 * falle en el `<img>`, que ya avisa, y no en silencio acá.
 */
export function urlDeRecorte(url: string | null | undefined, origen: string): string | null {
  if (!url || !url.trim()) return null

  let resuelta: URL
  try {
    // La base resuelve las rutas relativas y no estorba a las absolutas.
    resuelta = new URL(url, origen)
  } catch {
    return url
  }

  if (!resuelta.pathname.startsWith(RUTA_DE_RECORTES)) return url

  return `${origen}${resuelta.pathname}${resuelta.search}${resuelta.hash}`
}
