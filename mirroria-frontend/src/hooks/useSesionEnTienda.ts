import { useAuth } from "./useAuth"
import { useTienda } from "./useTienda"

/**
 * El usuario logueado SOLO si su sesión es de la tienda que se navega. Con
 * sesión de otra tienda devuelve null: se navega como invitada (spec §7.3).
 */
export function useSesionEnTienda() {
  const { user } = useAuth()
  const { slug } = useTienda()
  return user && slug && user.tenant?.slug === slug ? user : null
}
