import { ShoppingBag } from "@phosphor-icons/react"
import { cn } from "cn"
import { LogoTienda } from "../logo-tienda"
import type { PropsPreview } from "./tipos"

/** Cabecera de la mini tienda: logo o monograma, links no clicables y carrito con el acento. */
export function PreviewHeader({ marca, nombre, celular }: PropsPreview) {
  return (
    <div className={cn("flex h-16 items-center gap-8 border-b border-border/60 bg-background", celular ? "px-4" : "px-10")}>
      <LogoTienda nombre={nombre || "Tu tienda"} logoUrl={marca.logoUrl} />
      {!celular && (
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span className="relative text-foreground">
            Tienda
            <span className="absolute inset-x-0 -bottom-1.5 h-0.5 rounded-full bg-brand-accent" />
          </span>
          <span>Categorías</span>
          <span>Sucursales</span>
        </div>
      )}
      <span className="relative ml-auto flex size-9 items-center justify-center rounded-lg text-foreground">
        <ShoppingBag className="size-5" />
        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-brand-accent text-[10px] font-semibold text-brand-accent-foreground">
          2
        </span>
      </span>
    </div>
  )
}
