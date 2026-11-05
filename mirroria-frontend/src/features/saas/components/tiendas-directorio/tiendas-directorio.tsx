import { ArrowClockwise, Storefront } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { TiendaPublica } from "@/types/tienda.types"
import { cn } from "cn"
import { TiendaCard } from "./tienda-card"

interface Props {
  tiendas: TiendaPublica[]
  isLoading: boolean
  error: string | null
  onReintentar: () => void
}

/** Directorio (`/#tiendas`): la prueba social honesta son tiendas reales, cada una con su marca. */
export function TiendasDirectorio({ tiendas, isLoading, error, onReintentar }: Props) {
  return (
    <section id="tiendas" className="scroll-mt-20 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="max-w-[22ch] text-3xl font-bold tracking-tight text-balance sm:text-4xl">Tiendas que ya venden con MirrorIA.</h2>
        <p className="mt-3 max-w-[50ch] text-muted-foreground">Misma plataforma, marcas distintas. Entrá a cualquiera y mirala por dentro.</p>
        <div className="mt-10">
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-[4/3.6] rounded-2xl" />)}</div>
          ) : error ? (
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm">
              <p>No pudimos cargar el directorio de tiendas.</p>
              <Button variant="outline" size="sm" onClick={onReintentar} className="gap-1.5"><ArrowClockwise /> Reintentar</Button>
            </div>
          ) : tiendas.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-10 text-center">
              <Storefront className="size-10 text-primary" weight="light" />
              <p className="font-medium">Sé la primera tienda.</p>
              <Link to="/registro-tienda" className={cn(buttonVariants({ variant: "outline" }))}>Crear mi tienda</Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{tiendas.map((t) => <TiendaCard key={t.id} tienda={t} />)}</div>
          )}
        </div>
      </div>
    </section>
  )
}
