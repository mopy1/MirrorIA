import { BrandLogo } from "@/components/brand-logo"
import { useTienda } from "@/hooks/useTienda"
import { cn } from "cn"

/** Logo del header de una tienda: la marca + el nombre de la tienda (fuera de `/t/:slug`, la marca sola). */
export function TiendaLogo({ className }: { className?: string }) {
  const { tienda } = useTienda()
  if (!tienda) return <BrandLogo className={className} />
  return (
    <div className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <BrandLogo withText={false} />
      <div className="flex min-w-0 flex-col leading-none">
        <span className="truncate text-lg font-bold tracking-tight text-foreground">{tienda.nombre}</span>
        <span className="mt-0.5 text-[11px] text-muted-foreground">con MirrorIA</span>
      </div>
    </div>
  )
}
