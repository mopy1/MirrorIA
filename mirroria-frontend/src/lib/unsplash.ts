/**
 * Fotos reales de Unsplash (licencia libre, verificadas una por una — no Unsplash+
 * premium) usadas como placeholder de contenido mientras `catalogo` no tiene
 * productos reales sembrados con sus propias imágenes. Reemplazar por
 * `producto.imagenes` en cuanto exista esa data.
 */
export function unsplashUrl(photoId: string, width: number, height: number): string {
  return `https://images.unsplash.com/photo-${photoId}?w=${width}&h=${height}&fit=crop&q=80&auto=format`
}

/**
 * Igual que unsplashUrl(), pero SIN forzar un recorte de servidor a un ancho×alto
 * fijo — devuelve la foto en su proporción nativa, escalada a `width`. Usar
 * cuando el mismo elemento se va a mostrar en contenedores de proporción muy
 * distinta según el viewport (ej. un hero full-bleed: panorámico en desktop,
 * vertical en mobile) — ahí un recorte de servidor fijo descarta información
 * que hace falta para que `object-cover` recorte bien en AMBOS casos. El
 * recorte real queda 100% del lado del navegador vía CSS (object-fit +
 * object-position), que sí puede adaptarse por breakpoint.
 */
export function unsplashUrlNative(photoId: string, width: number): string {
  return `https://images.unsplash.com/photo-${photoId}?w=${width}&q=80&auto=format`
}
