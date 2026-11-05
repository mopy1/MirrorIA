import { useState } from "react"
import { ArrowRight } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { usePlanes } from "../../hooks/usePlanes"
import { MonedaToggle, type Moneda } from "./moneda-toggle"
import { PlanesGrid } from "./planes-grid"

/** Sección "Planes" de la landing (`/planes` suma la comparativa completa). */
export function SeccionPlanes() {
  const { planes, isLoading, error, reload } = usePlanes()
  const [moneda, setMoneda] = useState<Moneda>("BOB")
  return (
    <section id="planes" className="scroll-mt-20 bg-muted/50 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="max-w-[20ch] text-3xl font-bold tracking-tight text-balance sm:text-4xl">Pagás según el tamaño de tu marca.</h2>
          <MonedaToggle valor={moneda} onCambiar={setMoneda} />
        </div>
        <div className="mt-12">
          <PlanesGrid planes={planes} isLoading={isLoading} error={error} onReintentar={reload} moneda={moneda} />
        </div>
        <Link to="/planes" className="mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline">
          Comparar planes en detalle <ArrowRight />
        </Link>
      </div>
    </section>
  )
}
