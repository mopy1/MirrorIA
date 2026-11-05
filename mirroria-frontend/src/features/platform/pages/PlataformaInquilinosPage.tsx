import { InquilinosFiltros } from "../components/inquilinos-filtros"
import { InquilinosTable } from "../components/inquilinos-table"
import { useFiltrosInquilinos } from "../hooks/useFiltrosInquilinos"
import { useInquilinos } from "../hooks/useInquilinos"
import { usePlanesPlataforma } from "../hooks/usePlanesPlataforma"

/** `/plataforma/inquilinos` — listado con filtros en la URL (los KPIs viven en Resumen). */
export function PlataformaInquilinosPage() {
  const f = useFiltrosInquilinos()
  const lista = useInquilinos(f.filtros)
  const planes = usePlanesPlataforma()
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tiendas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cada tienda con su marca, su plan y cuánto usa. Para actuar sobre una, entrá a Gestionar.</p>
      </div>
      <InquilinosFiltros filtros={f.filtros} planes={planes.items} busqueda={f.busqueda} onBusqueda={f.setBusqueda} onChange={f.setFiltros} />
      <InquilinosTable key={JSON.stringify(f.filtros)} inquilinos={lista.data} isLoading={lista.isLoading} error={lista.error} hayFiltros={f.hayFiltros} onReintentar={lista.reload} onLimpiarFiltros={f.limpiar} />
    </div>
  )
}
