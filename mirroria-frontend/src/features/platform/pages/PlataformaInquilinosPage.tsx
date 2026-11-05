import { InquilinosFiltros } from "../components/inquilinos-filtros"
import { InquilinosTable } from "../components/inquilinos-table"
import { ResumenKpis } from "../components/resumen-kpis"
import { TrialsPorVencer } from "../components/trials-por-vencer"
import { useFiltrosInquilinos } from "../hooks/useFiltrosInquilinos"
import { useInquilinos } from "../hooks/useInquilinos"
import { useResumenPlataforma } from "../hooks/useResumenPlataforma"

/** `/plataforma/inquilinos` — KPIs + tabla de tiendas con filtros. */
export function PlataformaInquilinosPage() {
  const resumen = useResumenPlataforma()
  const f = useFiltrosInquilinos()
  const lista = useInquilinos(f.filtros)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tiendas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Estado comercial de cada tienda de la plataforma. Solo conteos: los datos de negocio son de cada comerciante.</p>
      </div>
      <ResumenKpis resumen={resumen.data} isLoading={resumen.isLoading} />
      {resumen.error && <p className="text-sm text-destructive">{resumen.error}</p>}
      {resumen.data && <TrialsPorVencer trials={resumen.data.trialsPorVencer} />}
      <InquilinosFiltros filtros={f.filtros} busqueda={f.busqueda} onBusqueda={f.setBusqueda} onChange={f.setFiltros} />
      <InquilinosTable inquilinos={lista.data} isLoading={lista.isLoading} error={lista.error} hayFiltros={f.hayFiltros} onReintentar={lista.reload} onLimpiarFiltros={f.limpiar} />
    </div>
  )
}
