import { ArrowClockwise, ArrowLeft, WarningCircle } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PasarelasSuscripcion } from "../components/pasarelas-suscripcion"
import { ResumenActivacion } from "../components/resumen-activacion"
import { useMiSuscripcion } from "../hooks/useMiSuscripcion"

/** `/admin/suscripcion/activar` (ADMIN): checkout de la suscripción. Las pasarelas las conecta la Fase 2. */
export function ActivarPlanPage() {
  const { data, isLoading, error, reload } = useMiSuscripcion()
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <Link to="/admin/suscripcion" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft /> Volver a mi plan
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activar plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Al pagar, tu tienda sigue abierta sin cortes y conserva todo lo que cargaste.</p>
      </div>
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
          <ResumenActivacion data={data} />
          <PasarelasSuscripcion />
        </>
      )}
    </div>
  )
}
