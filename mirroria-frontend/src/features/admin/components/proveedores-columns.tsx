import type { ReactNode } from "react"
import { EnvelopeSimple, Phone, Plus } from "@phosphor-icons/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ResumenOrdenesProveedor } from "@/features/inventory/lib/resumen-ordenes"
import type { Proveedor } from "@/features/providers/types/providers.types"

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface Opciones {
  resumen: Map<string, ResumenOrdenesProveedor>
  onNuevaOrden: (proveedor: Proveedor) => void
}

/** Columnas de /admin/proveedores. "Órdenes abiertas" sale de
 * GET /inventario/ordenes-compra cruzado en cliente por proveedorId. */
export function proveedoresColumns({ resumen, onNuevaOrden }: Opciones): {
  key: string
  label: string
  render: (p: Proveedor) => ReactNode
}[] {
  return [

      {
        key: "razonSocial",
        label: "Proveedor y Razón Social",
        render: (p) => (
          <div className="flex items-center gap-3">
            <Avatar size="default">
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                {getInitials(p.razonSocial)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium text-sm text-foreground truncate">{p.razonSocial}</p>
              {p.contactoNombre && (
                <p className="text-xs text-muted-foreground truncate">{p.contactoNombre}</p>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "nit",
        label: "NIT",
        render: (p) => (
          <Badge variant="outline" className="font-mono text-xs font-normal">
            {p.nit ?? "Sin NIT"}
          </Badge>
        ),
      },
      {
        key: "contactoEmail",
        label: "Email de contacto",
        render: (p) =>
          p.contactoEmail ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <EnvelopeSimple className="size-3.5 shrink-0" />
              <span className="truncate">{p.contactoEmail}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        key: "contactoTelefono",
        label: "Teléfono",
        render: (p) =>
          p.contactoTelefono ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="size-3.5 shrink-0" />
              <span>{p.contactoTelefono}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
    {
      key: "ordenes",
      label: "Órdenes abiertas",
      render: (p) => {
        const r = resumen.get(p.id)
        return r ? (
          <div className="text-xs">
            <p className="font-medium text-foreground">{r.abiertas} abierta{r.abiertas === 1 ? "" : "s"}</p>
            <p className="text-muted-foreground font-mono">{r.unidadesEnTransito} u. en tránsito</p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Sin órdenes abiertas</span>
        )
      },
    },
    {
      key: "acciones",
      label: "",
      render: (p) => (
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => onNuevaOrden(p)}>
          <Plus className="size-3.5" />
          Nueva orden
        </Button>
      ),
    },
  ]
}
