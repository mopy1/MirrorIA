import { CalendarBlank, Warning } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSucursales } from "@/features/branches/hooks/useSucursales"
import { useVariantesConProducto } from "@/features/catalog/hooks/useVariantesConProducto"
import { useCreateResource } from "@/hooks/useCreateResource"
import { useRutaTienda } from "@/hooks/useRutaTienda"
import { useOutbox } from "@/lib/offline/use-outbox"
import { cn } from "cn"
import { reservationsApi } from "../api/reservationsApi"
import { ReservaCard } from "../components/reserva-card"
import { ReservasEnCola } from "../components/reservas-en-cola"
import { useCupoReserva } from "../hooks/useCupoReserva"
import { useMisReservas } from "../hooks/useMisReservas"

export function MyReservationsPage() {
  const ruta = useRutaTienda()
  const { items, ventas, enCola, isLoading, error, reloadTodo } = useMisReservas()
  const { sucursales } = useSucursales()
  const { variantes } = useVariantesConProducto()
  const { online } = useOutbox()
  // La ruta es protegida: siempre hay sesión acá.
  const { cupo, reload: recargarCupo } = useCupoReserva(true)
  const cancelar = useCreateResource((id: string) => reservationsApi.cancelar(id))

  async function handleCancelar(id: string) {
    if (await cancelar.submit(id)) {
      reloadTodo()
      recargarCupo()
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Mis reservas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Prendas apartadas para probarte en una sucursal. Cuando llegues, el personal te marca "En tienda" y desde acá
        comprás lo que reservaste.
      </p>

      {cupo?.bloqueadaHasta && (
        <Alert variant="destructive" className="mt-6">
          <Warning />
          <AlertDescription>
            {cupo.motivo ??
              `No podés hacer reservas nuevas hasta el ${new Date(cupo.bloqueadaHasta).toLocaleString("es-BO", { dateStyle: "medium", timeStyle: "short" })}.`}
          </AlertDescription>
        </Alert>
      )}

      {(error || cancelar.error) && <p className="mt-6 text-sm text-destructive">{error ?? cancelar.error}</p>}

      <ReservasEnCola operaciones={enCola} />

      {isLoading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 && enCola.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <CalendarBlank className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Todavía no reservaste ninguna prenda.</p>
          <Link to={ruta("/tienda")} className={cn(buttonVariants())}>
            Elegir una prenda para probarme
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {items.map((reserva) => (
            <ReservaCard
              key={reserva.id}
              reserva={reserva}
              sucursal={sucursales.find((s) => s.id === reserva.sucursalId)}
              variantes={variantes}
              ventas={ventas}
              online={online}
              isCancelando={cancelar.isLoading}
              onCancelar={handleCancelar}
              onCambio={reloadTodo}
            />
          ))}
        </div>
      )}
    </div>
  )
}
