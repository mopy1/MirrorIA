/**
 * Estado de red de la PWA = red real (`navigator.onLine`) Y que no esté prendido el
 * interruptor de la demo "Simular sin red" (para la defensa, sin apagar el Wi-Fi).
 * Con el interruptor prendido, `apiFetch` rechaza las mutaciones antes del `fetch`
 * (nada se escapa) y la outbox no envía; las lecturas siguen (en offline real las
 * sirve el Service Worker desde su caché).
 */
export const CLAVE_SIN_RED = 'mirroria:sin-red-demo'
export const EVENTO_ESTADO_RED = 'mirroria:estado-red'

export function sinRedSimulado(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(CLAVE_SIN_RED) === '1'
  } catch {
    return false
  }
}

export function hayRed(): boolean {
  const real = typeof navigator !== 'undefined' ? navigator.onLine !== false : true
  return real && !sinRedSimulado()
}

export function setSinRedSimulado(activo: boolean): void {
  try {
    if (activo) localStorage.setItem(CLAVE_SIN_RED, '1')
    else localStorage.removeItem(CLAVE_SIN_RED)
  } catch {
    // Sin storage (modo privado): la demo no se puede activar, la app sigue igual.
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENTO_ESTADO_RED, { detail: { online: hayRed() } }))
  }
}
