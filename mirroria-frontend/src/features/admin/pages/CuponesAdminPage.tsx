import { ArrowsClockwise, Ticket } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCupones } from "@/features/promotions/hooks/useCupones"
import { CrearCuponDialog } from "../components/crear-cupon-dialog"
import { CuponesTable } from "../components/cupones-table"

export function CuponesAdminPage() {
  const {
    cupones,
    isLoading,
    error,
    actionLoading,
    actionError,
    reload,
    crearCupon,
    toggleEstado,
  } = useCupones()

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 max-w-7xl 2xl:max-w-[1536px] w-full mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Ticket className="size-7 text-primary" />
            Promociones y Cupones
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona códigos de descuento porcentuales o montos fijos para incentivar ventas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={isLoading || actionLoading}
            className="gap-1.5 shadow-xs"
          >
            <ArrowsClockwise className="size-4" data-icon="inline-start" />
            <span>Actualizar</span>
          </Button>
          <CrearCuponDialog onCrear={crearCupon} isLoading={actionLoading} />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {actionError && (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <Card className="border-border/70 shadow-xs overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20 py-4 px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Listado de Cupones</CardTitle>
              <CardDescription className="text-xs">
                {cupones.length} {cupones.length === 1 ? "cupón registrado" : "cupones registrados"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <CuponesTable
            cupones={cupones}
            isLoading={isLoading}
            onToggleEstado={toggleEstado}
            actionLoading={actionLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
