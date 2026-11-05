import { useState } from "react"
import { ArrowClockwise, Plus, Tag, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api"
import { plataformaApi } from "../api/plataformaApi"
import { PlanFormDialog } from "../components/plan-form-dialog"
import { PlanesTable } from "../components/planes-table"
import { usePlanesPlataforma } from "../hooks/usePlanesPlataforma"
import type { PlanDto } from "../types/plataforma.types"

/** `/plataforma/planes` — catálogo de planes (incluye retirados) + crear/editar. */
export function PlataformaPlanesPage() {
  const planes = usePlanesPlataforma()
  const [editando, setEditando] = useState<PlanDto | null | undefined>(undefined) // undefined = cerrado, null = nuevo
  const [cambiando, setCambiando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function alternar(p: PlanDto) {
    setCambiando(p.id)
    setError(null)
    try {
      await plataformaApi.actualizarPlan(p.id, { activo: !p.activo })
      planes.reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cambiar el plan")
    } finally {
      setCambiando(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Planes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Lo que se ofrece en la landing. Un plan retirado deja de ofrecerse, pero sus suscripciones siguen.</p>
        </div>
        <Button onClick={() => setEditando(null)} className="gap-1.5"><Plus /> Nuevo plan</Button>
      </div>
      {error && <Alert variant="destructive"><WarningCircle weight="fill" /><AlertDescription>{error}</AlertDescription></Alert>}
      {planes.isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : planes.error ? (
        <Alert variant="destructive">
          <WarningCircle weight="fill" />
          <AlertDescription>{planes.error}</AlertDescription>
          <AlertAction><Button size="sm" variant="outline" onClick={planes.reload} className="gap-1.5"><ArrowClockwise /> Reintentar</Button></AlertAction>
        </Alert>
      ) : planes.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-12 text-center">
          <Tag className="size-10 text-primary" weight="light" />
          <p className="font-medium">No hay planes cargados.</p>
          <Button variant="outline" onClick={() => setEditando(null)}>Crear el primer plan</Button>
        </div>
      ) : (
        <PlanesTable planes={planes.items} cambiando={cambiando} onEditar={setEditando} onAlternarActivo={alternar} />
      )}
      {editando !== undefined && (
        <PlanFormDialog key={editando?.id ?? "nuevo"} open onOpenChange={(o) => !o && setEditando(undefined)} plan={editando} onGuardado={planes.reload} />
      )}
    </div>
  )
}
