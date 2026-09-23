import { ArrowLeft, CoatHanger } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

/** Cualquier dirección que no case con ninguna ruta.
 *
 * Antes no existía: `nginx.conf` sirve `index.html` para todo (es una SPA), y
 * como `App.tsx` no tenía comodín, React no montaba NADA. La página quedaba
 * completamente en blanco —sin cabecera ni pie, 0 px de alto—, que es peor que
 * un 404: parece que el sitio se cayó. */
export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <CoatHanger weight="light" className="size-12 text-primary" />

      <p className="mt-6 text-xs font-semibold tracking-widest text-primary uppercase">Error 404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Esta página no existe.
      </h1>
      <p className="mt-3 max-w-[46ch] text-sm text-muted-foreground">
        Puede que la dirección esté mal escrita o que el enlace que seguiste ya no apunte a ningún
        lado. El catálogo y las sucursales siguen donde estaban.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link to="/" className={cn(buttonVariants())}>
          <ArrowLeft className="size-4" weight="bold" />
          Volver al inicio
        </Link>
        <Link to="/tienda" className={cn(buttonVariants({ variant: "outline" }))}>
          Ver el catálogo
        </Link>
      </div>
    </div>
  )
}
