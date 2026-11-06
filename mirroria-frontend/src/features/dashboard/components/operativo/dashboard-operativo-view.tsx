import type { ReactNode } from "react"
import { Storefront } from "@phosphor-icons/react"
import { Skeleton } from "@/components/ui/skeleton"
import type { UsuarioRole } from "@/features/auth/types/auth.types"
import { fechaLarga } from "../../lib/fechas-dashboard"
import type { DashboardOperativoDto } from "../../types/dashboard.types"
import { BloqueError } from "../shared/bloque-error"
import { BotonActualizar } from "../shared/boton-actualizar"
import { EncabezadoDashboard, type CambioModo } from "../shared/encabezado-dashboard"
import { AccesosDirectos } from "./accesos-directos"
import { AgendaCitas } from "./agenda-citas"
import { NumerosDelDia } from "./numeros-del-dia"
import { StockPorAgotarse } from "./stock-por-agotarse"

interface DashboardOperativoViewProps {
  data: DashboardOperativoDto | null
  isLoading: boolean
  error: string | null
  onRecargar: () => void
  rol?: UsuarioRole
  modo?: CambioModo
  sucursalSelector?: ReactNode
}

/** "Hoy en la tienda": lo que pasa hoy en la sucursal y qué hacer ahora. */
export function DashboardOperativoView({ data, isLoading, error, onRecargar, rol, modo, sucursalSelector }: DashboardOperativoViewProps) {
  const cargando = isLoading || (!data && !error)
  const bajada = data ? (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
        <Storefront className="size-4 text-muted-foreground" />
        {data.sucursal.nombre}
        {data.sucursal.ciudad && <span className="font-normal text-muted-foreground">· {data.sucursal.ciudad}</span>}
      </span>
      <span>· {fechaLarga(data.fecha)}</span>
    </span>
  ) : error ? null : (
    <Skeleton className="h-4 w-60" />
  )

  return (
    <div className="flex flex-col gap-5">
      <EncabezadoDashboard
        titulo="Hoy en la tienda"
        modo={modo}
        bajada={bajada}
        acciones={
          <>
            {sucursalSelector}
            <BotonActualizar onClick={onRecargar} cargando={isLoading} />
          </>
        }
      />
      <AccesosDirectos rol={rol} />

      {error && !isLoading ? (
        <BloqueError titulo="No pudimos cargar lo de hoy" onReintentar={onRecargar} />
      ) : (
        <>
          <NumerosDelDia kpis={data?.kpisHoy} isLoading={cargando} />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <AgendaCitas citas={data?.reservasHoy} isLoading={cargando} onActualizado={onRecargar} />
            <StockPorAgotarse
              alertas={data?.alertasStock}
              isLoading={cargando}
              puedeVerInventario={rol === "ADMIN" || rol === "ENCARGADO_SUCURSAL"}
            />
          </div>
        </>
      )}
    </div>
  )
}
