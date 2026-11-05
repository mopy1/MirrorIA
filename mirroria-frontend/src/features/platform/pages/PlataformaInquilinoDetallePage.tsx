import { useState } from "react"
import { ArrowLeft, ArrowClockwise, WarningCircle } from "@phosphor-icons/react"
import { Link, useParams } from "react-router-dom"
import { HistorialSuscripcion } from "@/components/common/HistorialSuscripcion"
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CambiarPlanInquilinoDialog } from "../components/cambiar-plan-inquilino-dialog"
import { ExtenderDialog } from "../components/extender-dialog"
import { InquilinoCabecera, type DialogoInquilino } from "../components/inquilino-cabecera"
import { InquilinoMetricas } from "../components/inquilino-metricas"
import { SuspenderDialog } from "../components/suspender-dialog"
import { useAccionesInquilino } from "../hooks/useAccionesInquilino"
import { useInquilino } from "../hooks/useInquilino"

/** `/plataforma/inquilinos/:id` — detalle y acciones sobre una tienda. */
export function PlataformaInquilinoDetallePage() {
  const { id = "" } = useParams()
  const { data, setData, isLoading, error, reload } = useInquilino(id)
  const acciones = useAccionesInquilino(id, setData)
  const [dialogo, setDialogo] = useState<DialogoInquilino>(null)
  const abrir = (d: DialogoInquilino) => { acciones.limpiar(); setDialogo(d) }
  const cerrar = (o: boolean) => !o && setDialogo(null)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      <Link to="/plataforma/inquilinos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft /> Volver a tiendas
      </Link>
      {isLoading && <Skeleton className="h-64 rounded-xl" />}
      {error && !isLoading && (
        <Alert variant="destructive">
          <WarningCircle weight="fill" />
          <AlertDescription>{error}</AlertDescription>
          <AlertAction><Button size="sm" variant="outline" onClick={reload} className="gap-1.5"><ArrowClockwise /> Reintentar</Button></AlertAction>
        </Alert>
      )}
      {data && !isLoading && (
        <>
          <InquilinoCabecera i={data} onAbrir={abrir} />
          <InquilinoMetricas i={data} />
          <section className="space-y-3">
            <h2 className="text-lg font-medium">Historial de suscripciones</h2>
            <HistorialSuscripcion historial={data.historial} />
          </section>
          <SuspenderDialog key={`e${dialogo}`} open={dialogo === "estado"} onOpenChange={cerrar} suspendida={data.estado === "SUSPENDIDO"} nombre={data.nombre} isLoading={acciones.enCurso === "estado"} error={acciones.errorDe("estado")} onConfirmar={(m) => acciones.cambiarEstado(data.estado === "SUSPENDIDO" ? "ACTIVO" : "SUSPENDIDO", m)} />
          <CambiarPlanInquilinoDialog key={`p${dialogo}`} open={dialogo === "plan"} onOpenChange={cerrar} actual={data.plan.codigo} isLoading={acciones.enCurso === "plan"} error={acciones.errorDe("plan")} onConfirmar={acciones.cambiarPlan} />
          <ExtenderDialog key={`x${dialogo}`} open={dialogo === "extender"} onOpenChange={cerrar} isLoading={acciones.enCurso === "extender"} error={acciones.errorDe("extender")} onConfirmar={acciones.extender} />
        </>
      )}
    </div>
  )
}
