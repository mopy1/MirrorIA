import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSucursales } from "@/features/branches/hooks/useSucursales"
import { useVariantesConProducto } from "@/features/catalog/hooks/useVariantesConProducto"
import { useCreateResource } from "@/hooks/useCreateResource"
import { useResourceList } from "@/hooks/useResourceList"
import { reservationsApi } from "../api/reservationsApi"

const CANCELABLES = ["PENDIENTE", "CONFIRMADA"]

export function MyReservationsPage() {
  const { items, isLoading, error, reload } = useResourceList(reservationsApi.getMisReservas)
  const { sucursales } = useSucursales()
  const { variantes } = useVariantesConProducto()
  const { submit: cancelar, isLoading: isCancelando } = useCreateResource((id: string) =>
    reservationsApi.cancelar(id)
  )

  async function handleCancelar(id: string) {
    const result = await cancelar(id)
    if (result) reload()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Mis reservas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Prendas apartadas para probarte en una sucursal.
      </p>

      {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted-foreground">
          Todavía no reservaste ninguna prenda.
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {items.map((reserva) => {
            const sucursal = sucursales.find((s) => s.id === reserva.sucursalId)
            return (
              <div key={reserva.id} className="rounded-2xl border border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">
                      {sucursal ? `${sucursal.nombre} — ${sucursal.ciudadNombre}` : reserva.sucursalId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(reserva.fechaHoraPrevista).toLocaleString("es-BO", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <Badge variant="secondary">{reserva.estado}</Badge>
                </div>

                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {reserva.items.map((item) => {
                    const variante = variantes.find((v) => v.varianteId === item.varianteId)
                    return (
                      <li key={item.id}>
                        {variante
                          ? `${variante.productoTitulo} (${variante.tallaNombre} · ${variante.colorNombre})`
                          : item.varianteId}{" "}
                        × {item.cantidad}
                      </li>
                    )
                  })}
                </ul>

                {CANCELABLES.includes(reserva.estado) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    disabled={isCancelando}
                    onClick={() => handleCancelar(reserva.id)}
                  >
                    Cancelar reserva
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
