import { ArrowClockwise, ArrowsLeftRight, Info, WarningCircle } from "@phosphor-icons/react"
import { useState } from "react"
import { HistorialSuscripcion } from "@/components/common/HistorialSuscripcion"
import { UsoPlanMeters } from "@/components/common/UsoPlanMeters"
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CambiarPlanDialog } from "../components/cambiar-plan-dialog"
import { PagarSuscripcionCta } from "../components/pagar-suscripcion-cta"
import { PlanActualCard } from "../components/plan-actual-card"
import { useMiSuscripcion } from "../hooks/useMiSuscripcion"

/** `/admin/suscripcion` (solo ADMIN): plan, estado, vigencia, uso vs límites e historial. */
export function SuscripcionAdminPage() {
  const { data, setData, isLoading, error, reload } = useMiSuscripcion()
  const [dialogo, setDialogo] = useState(false)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Plan y suscripción</h1>
        <p className="mt-1 text-sm text-muted-foreground">Lo que incluye tu plan, cuánto estás usando y hasta cuándo está vigente.</p>
      </div>

      {isLoading && <Skeleton className="h-56 rounded-xl" />}
      {error && !isLoading && (
        <Alert variant="destructive">
          <WarningCircle weight="fill" />
          <AlertDescription>{error}</AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={reload} className="gap-1.5"><ArrowClockwise /> Reintentar</Button>
          </AlertAction>
        </Alert>
      )}

      {data && !isLoading && (
        <>
          <PlanActualCard
            data={data}
            acciones={
              <>
                {data.puedeCambiarPlan && (
                  <Button onClick={() => setDialogo(true)} className="gap-2"><ArrowsLeftRight /> Cambiar plan</Button>
                )}
                <PagarSuscripcionCta />
              </>
            }
          />
          {!data.puedeCambiarPlan && (
            <Alert>
              <Info />
              <AlertDescription>El cambio de plan con cobro llega con las pasarelas de pago. Mientras tanto, tu plan sigue igual.</AlertDescription>
            </Alert>
          )}
          <section className="space-y-3">
            <h2 className="text-lg font-medium">Uso del plan</h2>
            <UsoPlanMeters uso={data.uso} limites={data.plan.limites} />
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-medium">Historial</h2>
            <HistorialSuscripcion historial={data.historial} />
          </section>
          <CambiarPlanDialog key={String(dialogo)} open={dialogo} onOpenChange={setDialogo} actual={data.plan.codigo} onCambiado={setData} />
        </>
      )}
    </div>
  )
}
