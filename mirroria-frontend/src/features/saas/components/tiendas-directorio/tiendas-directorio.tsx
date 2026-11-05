import { ArrowClockwise, Storefront } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "cn"
import { useTiendasDirectorio } from "../../hooks/useTiendasDirectorio"
import { TiendaCard } from "./tienda-card"

/** Directorio de tiendas disponibles (`/#tiendas`), con sus 4 estados. */
export function TiendasDirectorio() {
  const { tiendas, isLoading, error, reload } = useTiendasDirectorio()

  return (
    <section id="tiendas" className="scroll-mt-20 border-b border-border/60 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">Tiendas</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Marcas que ya venden con MirrorIA</h2>
        <div className="mt-10">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm">
              <p>No pudimos cargar el directorio de tiendas.</p>
              <Button variant="outline" size="sm" onClick={reload} className="gap-1.5">
                <ArrowClockwise /> Reintentar
              </Button>
            </div>
          ) : tiendas.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-10 text-center">
              <Storefront className="size-10 text-primary" weight="light" />
              <p className="font-medium">Todavía no hay tiendas publicadas.</p>
              <Link to="/registro-tienda" className={cn(buttonVariants({ variant: "outline" }))}>
                Sé la primera
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tiendas.map((t) => (
                <TiendaCard key={t.id} tienda={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
