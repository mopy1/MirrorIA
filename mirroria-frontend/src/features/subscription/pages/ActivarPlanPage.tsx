import { ArrowClockwise, ArrowLeft, WarningCircle } from "@phosphor-icons/react"
import { Link, useNavigate } from "react-router-dom"
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { PasarelaId } from "@/features/payments/types/pasarelas.types"
import { CobroQrDialog } from "../components/cobro-qr-dialog"
import { PasarelasSuscripcion } from "../components/pasarelas-suscripcion"
import { ResumenActivacion } from "../components/resumen-activacion"
import { useCobroSuscripcion } from "../hooks/useCobroSuscripcion"
import { useMiSuscripcion } from "../hooks/useMiSuscripcion"

/** `/admin/suscripcion/activar` (ADMIN): checkout de la suscripción SaaS con pasarelas enchufables. */
export function ActivarPlanPage() {
  const navigate = useNavigate()
  const { data, isLoading: loadingSuscripcion, error: errorSuscripcion, reload } = useMiSuscripcion()
  const { cobroActual, iniciar, limpiarCobro, isLoading: loadingCobro, error: errorCobro } = useCobroSuscripcion()

  async function handleSeleccionarPasarela(pasarelaId: PasarelaId) {
    if (!data) return
    if (pasarelaId === "WAYRA" || pasarelaId === "STRIPE") {
      await iniciar({ pasarela: pasarelaId, planCodigo: data.plan.codigo })
    }
  }

  function handleExitoQr() {
    limpiarCobro()
    navigate("/admin/suscripcion?pago=exito")
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <Link to="/admin/suscripcion" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft /> Volver a mi plan
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activar plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Al pagar, tu tienda sigue abierta sin cortes y conserva todo lo que cargaste.</p>
      </div>
      {loadingSuscripcion && <Skeleton className="h-64 rounded-xl" />}
      {errorSuscripcion && !loadingSuscripcion && (
        <Alert variant="destructive">
          <WarningCircle weight="fill" />
          <AlertDescription>{errorSuscripcion}</AlertDescription>
          <AlertAction><Button size="sm" variant="outline" onClick={reload} className="gap-1.5"><ArrowClockwise /> Reintentar</Button></AlertAction>
        </Alert>
      )}
      {data && !loadingSuscripcion && (
        <>
          <ResumenActivacion data={data} />
          {errorCobro && (
            <Alert variant="destructive">
              <WarningCircle weight="fill" />
              <AlertDescription>{errorCobro}</AlertDescription>
            </Alert>
          )}
          <PasarelasSuscripcion onSeleccionar={handleSeleccionarPasarela} disabled={loadingCobro} />
          <CobroQrDialog
            cobro={cobroActual}
            onCerrar={limpiarCobro}
            onExito={handleExitoQr}
          />
        </>
      )}
    </div>
  )
}
