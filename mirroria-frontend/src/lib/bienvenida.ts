/**
 * Aviso de bienvenida tras el alta de una tienda. No viaja en el `state` del
 * router: al loguear, `GuestRoute` redirige a `/admin` antes que el navigate
 * del alta y ese `state` se perdía. Va en sessionStorage y se consume una vez.
 */
const CLAVE = "mirroria:bienvenida"

export function guardarBienvenida(dias: number): void {
  try {
    sessionStorage.setItem(CLAVE, String(dias))
  } catch {
    /* sin storage: no hay aviso, no pasa nada */
  }
}

export function leerBienvenida(): number | null {
  try {
    const v = sessionStorage.getItem(CLAVE)
    return v === null ? null : Number(v)
  } catch {
    return null
  }
}

export function borrarBienvenida(): void {
  try {
    sessionStorage.removeItem(CLAVE)
  } catch {
    /* idem */
  }
}
