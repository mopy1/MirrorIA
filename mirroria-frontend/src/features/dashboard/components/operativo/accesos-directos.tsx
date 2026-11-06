import { CalendarBlank, Money, Package, Warehouse, type Icon } from "@phosphor-icons/react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import type { UsuarioRole } from "@/features/auth/types/auth.types"

interface Acceso {
  texto: string
  href: string
  icon: Icon
  roles: UsuarioRole[]
}

/** Mismos permisos que las rutas: cada rol ve solo lo que puede abrir. */
const ACCESOS: Acceso[] = [
  { texto: "Confirmar un cobro", href: "/admin/cobros", icon: Money, roles: ["ADMIN", "CAJERO"] },
  { texto: "Ver citas", href: "/admin/reservas", icon: CalendarBlank, roles: ["ADMIN", "ENCARGADO_SUCURSAL", "CAJERO"] },
  { texto: "Revisar stock", href: "/admin/inventario", icon: Warehouse, roles: ["ADMIN", "ENCARGADO_SUCURSAL"] },
  { texto: "Ver catálogo", href: "/admin/catalogo", icon: Package, roles: ["ADMIN"] },
]

export function AccesosDirectos({ rol }: { rol?: UsuarioRole }) {
  const navigate = useNavigate()
  const visibles = ACCESOS.filter((a) => rol && a.roles.includes(rol))
  if (visibles.length === 0) return null

  return (
    <nav aria-label="Accesos rápidos" className="flex flex-wrap gap-2">
      {visibles.map((a, i) => {
        const Icono = a.icon
        return (
          <Button key={a.href} variant={i === 0 ? "default" : "outline"} size="lg" className="gap-2 px-3" onClick={() => navigate(a.href)}>
            <Icono className="size-4" weight="bold" />
            {a.texto}
          </Button>
        )
      })}
    </nav>
  )
}
