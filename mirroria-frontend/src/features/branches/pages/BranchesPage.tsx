import { MapPin, Phone } from "@phosphor-icons/react"
import { Skeleton } from "@/components/ui/skeleton"
import { useSucursales } from "../hooks/useSucursales"

export function BranchesPage() {
  const { sucursales, isLoading, error } = useSucursales()

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Nuestras sucursales</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Probate las prendas en persona en cualquiera de estas tiendas.
      </p>

      {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {sucursales.map((sucursal) => (
            <div key={sucursal.id} className="rounded-2xl border border-border p-5">
              <p className="font-medium text-foreground">{sucursal.nombre}</p>
              <p className="text-sm text-muted-foreground">{sucursal.ciudadNombre}</p>
              <div className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>{sucursal.direccion}</span>
              </div>
              {sucursal.telefono && (
                <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="size-4 shrink-0" />
                  <span>{sucursal.telefono}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
