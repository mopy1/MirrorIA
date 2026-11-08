import { ApiError } from "@/lib/api"

const CLAVE = "mirroria_tienda_"

/**
 * La ficha pública de la tienda se guarda en el navegador: si la primera visita
 * terminó antes de que el Service Worker tomara control, sin esto la tienda no
 * abría sin red. Solo se usa la copia si el servidor no respondió.
 */
export async function resolverTiendaConCache<T>(slug: string, traer: () => Promise<T>): Promise<T> {
  try {
    const tienda = await traer()
    try { localStorage.setItem(CLAVE + slug, JSON.stringify(tienda)) } catch { /* sin storage */ }
    return tienda
  } catch (error) {
    if (error instanceof ApiError && error.status < 500) throw error
    let copia: string | null = null
    try { copia = localStorage.getItem(CLAVE + slug) } catch { /* sin storage */ }
    if (!copia) throw error
    return JSON.parse(copia) as T
  }
}
