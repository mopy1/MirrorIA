import { ComparativaLimites, PlanesGrid } from "../components/planes-grid"
import { CtaFinal } from "../components/landing-cta"
import { usePlanes } from "../hooks/usePlanes"

/** `/planes` — tarjetas + tabla comparativa de límites. */
export function PlanesPage() {
  const { planes, isLoading, error, reload } = usePlanes()
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">Planes y precios</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Un plan para cada etapa de tu marca</h1>
        <p className="mt-3 max-w-[60ch] text-sm text-muted-foreground">
          Empezás con 14 días gratis en cualquier plan. Los límites cuentan sucursales activas, prendas activas y cuentas
          de staff (administración, encargadas y cajeras).
        </p>
        <div className="mt-10">
          <PlanesGrid planes={planes} isLoading={isLoading} error={error} onReintentar={reload} />
        </div>
        <div className="mt-12">
          <ComparativaLimites planes={planes} />
        </div>
      </section>
      <CtaFinal />
    </>
  )
}
