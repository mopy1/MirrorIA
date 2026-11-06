import { CalendarBlank, Money, Package, Warehouse } from "@phosphor-icons/react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function AccesosDirectosPos() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="default"
        size="sm"
        className="gap-2 font-medium shadow-xs"
        onClick={() => navigate("/admin/cobros")}
      >
        <Money className="size-4" weight="bold" />
        Registrar Cobro (POS)
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="gap-2 font-medium"
        onClick={() => navigate("/admin/reservas")}
      >
        <CalendarBlank className="size-4" weight="duotone" />
        Agenda de Citas
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="gap-2 font-medium"
        onClick={() => navigate("/admin/inventario")}
      >
        <Warehouse className="size-4" weight="duotone" />
        Consultar Stock
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="gap-2 font-medium text-muted-foreground hover:text-foreground"
        onClick={() => navigate("/admin/catalogo")}
      >
        <Package className="size-4" weight="duotone" />
        Catálogo de Prendas
      </Button>
    </div>
  )
}
