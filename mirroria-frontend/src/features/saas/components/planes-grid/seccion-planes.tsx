import { Link } from "react-router-dom"
import { usePlanes } from "../../hooks/usePlanes"
import { PlanesGrid } from "./planes-grid"

/** Sección "Planes" de la landing (la página /planes suma la tabla comparativa). */
export function SeccionPlanes({ conLinkComparar = true }: { conLinkComparar?: boolean }) {
  const { planes, isLoading, error, reload } = usePlanes()
  return (
    <section id="planes" className="scroll-mt-20 border-b border-border/60 bg-muted/20 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">Planes</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Pagás según el tamaño de tu marca.</h2>
            <p className="mt-2 text-sm text-muted-foreground">Precios en bolivianos por mes. Todos con prueba gratis.</p>
          </div>
          {conLinkComparar && (
            <Link to="/planes" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Comparar planes en detalle →
            </Link>
          )}
        </div>
        <div className="mt-10">
          <PlanesGrid planes={planes} isLoading={isLoading} error={error} onReintentar={reload} />
        </div>
      </div>
    </section>
  )
}
