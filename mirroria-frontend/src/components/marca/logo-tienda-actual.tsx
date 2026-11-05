import { useMarca } from "@/hooks/useMarca"
import { useTienda } from "@/hooks/useTienda"
import { LogoTienda } from "./logo-tienda"

/** Logo de la tienda que se navega (header, footer, menú móvil). Nunca el wordmark de Tiendaria. */
export function LogoTiendaActual({ className }: { className?: string }) {
  const { tienda } = useTienda()
  const marca = useMarca()
  if (!tienda) return null
  return <LogoTienda nombre={tienda.nombre} logoUrl={marca?.logoUrl} className={className} />
}
