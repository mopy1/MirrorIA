import { useState } from "react"
import { ArrowClockwise, MapPin, Plus, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CiudadFormDialog } from "../components/ciudad-form-dialog"
import { CiudadesTable } from "../components/ciudades-table"
import { useCiudadesPlataforma } from "../hooks/useCiudadesPlataforma"

/** `/plataforma/ciudades` — referencia geográfica global (D5). */
export function PlataformaCiudadesPage() {
  const ciudades = useCiudadesPlataforma()
  const [abierto, setAbierto] = useState(false)
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ciudades</h1>
          <p className="mt-1 text-sm text-muted-foreground">Las tiendas eligen de esta lista al abrir sucursales. Solo la plataforma agrega ciudades.</p>
        </div>
        <Button onClick={() => setAbierto(true)} className="gap-1.5"><Plus /> Nueva ciudad</Button>
      </div>
      {ciudades.isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : ciudades.error ? (
        <Alert variant="destructive">
          <WarningCircle weight="fill" />
          <AlertDescription>{ciudades.error}</AlertDescription>
          <AlertAction><Button size="sm" variant="outline" onClick={ciudades.reload} className="gap-1.5"><ArrowClockwise /> Reintentar</Button></AlertAction>
        </Alert>
      ) : ciudades.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-12 text-center">
          <MapPin className="size-10 text-primary" weight="light" />
          <p className="font-medium">No hay ciudades cargadas.</p>
          <Button variant="outline" onClick={() => setAbierto(true)}>Agregar la primera ciudad</Button>
        </div>
      ) : (
        <CiudadesTable ciudades={ciudades.items} />
      )}
      <CiudadFormDialog key={String(abierto)} open={abierto} onOpenChange={setAbierto} onCreada={ciudades.reload} />
    </div>
  )
}
