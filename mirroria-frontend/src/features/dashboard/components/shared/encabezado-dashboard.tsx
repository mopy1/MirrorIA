import type { ReactNode } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ModoDashboard } from "../../hooks/useDashboardPage"

export interface CambioModo {
  actual: ModoDashboard
  onCambiar: (m: ModoDashboard) => void
}

interface EncabezadoDashboardProps {
  /** Título de la vista cuando no hay pestañas (cajero o encargado). */
  titulo: string
  bajada?: ReactNode
  /** Pestañas Resumen / Hoy junto al título (solo quien puede ver ambas vistas). */
  modo?: CambioModo
  acciones?: ReactNode
}

/**
 * Con pestañas, el título es "Inicio" (como en el menú) y la pestaña activa dice qué vista es,
 * para no repetir "Resumen del negocio" dos veces seguidas.
 */
export function EncabezadoDashboard({ titulo, bajada, modo, acciones }: EncabezadoDashboardProps) {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground text-balance">
          {modo ? "Inicio" : titulo}
        </h1>
        {modo && (
          <Tabs value={modo.actual} onValueChange={(v) => modo.onCambiar(v as ModoDashboard)}>
            <TabsList aria-label="Vista del tablero" className="h-9!">
              <TabsTrigger value="resumen" className="px-3">Resumen del negocio</TabsTrigger>
              <TabsTrigger value="tienda" className="px-3">Hoy en la tienda</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>
      {(bajada || acciones) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {bajada && <div className="min-w-0 text-sm text-muted-foreground">{bajada}</div>}
          {acciones && <div className="flex min-w-0 flex-wrap items-center gap-2">{acciones}</div>}
        </div>
      )}
    </header>
  )
}
