import { ShoppingBag } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/useCart"
import { useRutaTienda } from "@/hooks/useRutaTienda"

/** Botón de bolsa de compras con micro-badge numérico y hover suave. */
export function HeaderCartTrigger() {
  const { itemCount } = useCart()
  const ruta = useRutaTienda()

  return (
    <Link to={ruta("/carrito")} className="relative inline-flex items-center">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Carrito de compras con ${itemCount} productos`}
        className="size-8.5 rounded-full text-foreground/80 hover:bg-muted/50 hover:text-foreground"
      >
        <ShoppingBag className="size-4.5" />
      </Button>
      {itemCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-semibold text-brand-accent-foreground leading-none shadow-xs animate-in zoom-in-75 duration-150"
          aria-hidden="true"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  )
}
