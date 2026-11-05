import { Storefront } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import type { TiendaPublica } from "@/types/tienda.types"
import { cn } from "cn"

/** `/t/:slug` de una tienda suspendida o con la suscripción vencida. */
export function TiendaNoDisponiblePage({ tienda }: { tienda: TiendaPublica }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <Storefront className="size-7" weight="duotone" />
      </div>
      <p className="mt-6 text-xs font-semibold tracking-widest text-primary uppercase">{tienda.nombre}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Esta tienda no está disponible por el momento.</h1>
      <p className="mt-3 max-w-[46ch] text-sm text-muted-foreground">
        La tienda está en pausa. Volvé a intentar más tarde, o mirá otras tiendas creadas con MirrorIA.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link to="/#tiendas" className={cn(buttonVariants())}>
          Ver otras tiendas
        </Link>
        <Link to={`/t/${tienda.slug}/login`} className={cn(buttonVariants({ variant: "outline" }))}>
          Soy la dueña: iniciar sesión
        </Link>
      </div>
    </div>
  )
}
