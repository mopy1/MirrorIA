import { EstadoConexionBadge } from "@/components/common/estado-conexion-badge"
import { HeaderSearchModal } from "./header-search-modal"
import { HeaderCartTrigger } from "./header-cart-trigger"
import { HeaderUserDropdown } from "./header-user-dropdown"

/** Agrupador de herramientas y perfil en la zona derecha de la navbar. */
export function HeaderActions() {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <EstadoConexionBadge />
      <HeaderSearchModal />
      <HeaderCartTrigger />
      <HeaderUserDropdown />
    </div>
  )
}
