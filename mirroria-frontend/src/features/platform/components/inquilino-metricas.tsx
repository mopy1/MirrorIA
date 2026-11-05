import { Warning } from "@phosphor-icons/react"
import { UsoPlanMeters } from "@/components/common/UsoPlanMeters"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { InquilinoDetalleDto } from "../types/plataforma.types"

/** Uso vs límites + conteos (nunca filas de negocio: privacidad del comerciante). */
export function InquilinoMetricas({ i }: { i: InquilinoDetalleDto }) {
  return (
    <div className="space-y-6">
      {i.motivoSuspension && i.estado === "SUSPENDIDO" && (
        <Alert variant="destructive">
          <Warning weight="fill" />
          <AlertTitle>Tienda suspendida</AlertTitle>
          <AlertDescription>{i.motivoSuspension}</AlertDescription>
        </Alert>
      )}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Uso vs límites del plan</h2>
        <UsoPlanMeters uso={i.uso} limites={i.limites} />
      </section>
      {/* Sucursales y prendas ya están en los medidores de arriba: acá solo lo que falta. */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Ventas pagadas (30 días)</p>
          <p className="mt-2 text-2xl font-semibold">{i.ventasPagadas30d}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Dueña</p>
          <p className="mt-2 truncate font-medium">{i.propietario?.fullName ?? "Sin propietaria registrada"}</p>
          {i.propietario && <p className="truncate text-sm text-muted-foreground">{i.propietario.email}</p>}
        </div>
      </section>
    </div>
  )
}
