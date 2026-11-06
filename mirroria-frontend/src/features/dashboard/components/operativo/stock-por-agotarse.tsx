import type { AlertaStockItemDto } from "../../types/dashboard.types"
import { EtiquetaTono } from "../shared/etiqueta-tono"
import { ListaBarrasSkeleton } from "../shared/lista-barras"
import { Seccion, VacioUtil } from "../shared/seccion"

interface StockPorAgotarseProps {
  alertas?: AlertaStockItemDto[]
  isLoading?: boolean
  /** El cajero no puede abrir Inventario: no se le muestra el link. */
  puedeVerInventario: boolean
}

export function StockPorAgotarse({ alertas, isLoading, puedeVerInventario }: StockPorAgotarseProps) {
  const titulo = "Stock por agotarse"
  const enlace = puedeVerInventario ? { href: "/admin/inventario", texto: "Revisar stock" } : undefined

  if (isLoading || !alertas) {
    return (
      <Seccion titulo={titulo}>
        <ListaBarrasSkeleton filas={3} />
      </Seccion>
    )
  }
  if (alertas.length === 0) {
    return (
      <Seccion titulo={titulo}>
        <VacioUtil texto="Todo con stock. Te avisamos aquí cuando una prenda baje de 3 unidades en esta sucursal." />
      </Seccion>
    )
  }

  return (
    <Seccion titulo={titulo} descripcion="Tallas y colores con 2 unidades o menos" enlace={enlace}>
      <ul className="-my-2 max-h-[26rem] divide-y divide-border overflow-y-auto">
        {alertas.map((a) => (
          <li key={a.inventarioId} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground break-words">{a.productoNombre}</p>
              <p className="text-xs text-muted-foreground">
                Talla {a.talla} · {a.color}
              </p>
            </div>
            {a.nivel === "AGOTADO" ? (
              <EtiquetaTono tono="mal">Agotada</EtiquetaTono>
            ) : (
              <EtiquetaTono tono="atencion">
                {a.stockDisponible === 1 ? "Queda 1" : `Quedan ${a.stockDisponible}`}
              </EtiquetaTono>
            )}
          </li>
        ))}
      </ul>
    </Seccion>
  )
}
