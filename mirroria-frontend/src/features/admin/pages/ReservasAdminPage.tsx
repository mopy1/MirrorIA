import { useState } from "react"
import { CalendarBlank, MagnifyingGlass, WarningCircle } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { branchesApi } from "@/features/branches/api/branchesApi"
import { reservationsApi } from "@/features/reservations/api/reservationsApi"
import { coincideCodigo } from "@/features/reservations/lib/codigoReserva"
import { useAuth } from "@/hooks/useAuth"
import { useResourceList } from "@/hooks/useResourceList"
import { ReservasTable } from "../components/reservas-table"

const TODAS_LAS_SUCURSALES = "__todas__"

export function ReservasAdminPage() {
  const [sucursalId, setSucursalId] = useState("")
  const [codigo, setCodigo] = useState("")
  // Encargado/cajero solo ven su sucursal (lo fuerza el backend): el selector
  // es solo para ADMIN.
  const { user } = useAuth()
  const esAdmin = user?.role === "ADMIN"
  const sucursales = useResourceList(branchesApi.getSucursales)
  const reservas = useResourceList(() =>
    reservationsApi.getAll({ sucursalId: sucursalId || undefined })
  )
  const visibles = reservas.items.filter((r) => coincideCodigo(r.id, codigo))
  // Para staff de sucursal el backend ya devuelve solo las de su sucursal.
  const suSucursal = sucursales.items.find((s) => s.id === reservas.items[0]?.sucursalId)?.nombre

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 max-w-7xl 2xl:max-w-[1536px] w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reservas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestión de citas para probarse prendas en sucursales físicas (RF09-12).
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5 py-1 px-3 text-xs font-normal w-fit">
          <CalendarBlank className="size-3.5 text-muted-foreground" />
          <span>{visibles.length} reservas</span>
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full sm:w-72">
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Código de la clienta (ej. D6018924)"
            aria-label="Buscar reserva por código"
            className="h-10 pl-9 font-mono uppercase placeholder:normal-case placeholder:font-sans"
          />
        </div>
        {!esAdmin ? (
          <p className="text-sm text-muted-foreground">Sucursal: {suSucursal ?? "la tuya"}</p>
        ) : (
        <div className="relative w-full sm:w-64">
          <Select
            value={sucursalId || TODAS_LAS_SUCURSALES}
            onValueChange={(v) => {
              setSucursalId(v === TODAS_LAS_SUCURSALES ? "" : (v as string))
              reservas.reload()
            }}
          >
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="Todas las sucursales">
                {(id: string) =>
                  id === TODAS_LAS_SUCURSALES
                    ? "Todas las sucursales"
                    : sucursales.items.find((s) => s.id === id)?.nombre ?? "Todas las sucursales"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS_LAS_SUCURSALES}>Todas las sucursales</SelectItem>
              {sucursales.items.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nombre} ({s.ciudadNombre})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        )}
      </div>

      {reservas.error && (
        <Alert variant="destructive">
          <WarningCircle className="size-4" />
          <AlertDescription>{reservas.error}</AlertDescription>
        </Alert>
      )}

      {reservas.isLoading ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : (
        <ReservasTable
          reservas={visibles}
          sucursales={sucursales.items}
          onReload={reservas.reload}
        />
      )}
    </div>
  )
}
