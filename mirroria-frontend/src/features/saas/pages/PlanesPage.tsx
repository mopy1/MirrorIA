import { useState } from "react"
import { ComparativaLimites, PlanesGrid } from "../components/planes-grid"
import { MonedaToggle, type Moneda } from "../components/planes-grid/moneda-toggle"
import { CtaFinal } from "../components/landing-cta"
import { usePlanes } from "../hooks/usePlanes"

/** `/planes` — tarjetas + comparativa de límites y de personalización, en Bs o USD. */
export function PlanesPage() {
  const { planes, isLoading, error, reload } = usePlanes()
  const [moneda, setMoneda] = useState<Moneda>("BOB")
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Un plan para cada etapa de tu marca</h1>
            <p className="mt-3 max-w-[60ch] text-muted-foreground">
              Empezás con 14 días sin pagar en cualquier plan. Los límites cuentan sucursales activas, prendas activas y cuentas del equipo.
            </p>
          </div>
          <MonedaToggle valor={moneda} onCambiar={setMoneda} />
        </div>
        <div className="mt-12">
          <PlanesGrid planes={planes} isLoading={isLoading} error={error} onReintentar={reload} moneda={moneda} />
        </div>
        <div className="mt-14">
          <ComparativaLimites planes={planes} />
        </div>
      </section>
      <CtaFinal />
    </>
  )
}
