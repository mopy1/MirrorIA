import { Link } from "react-router-dom"
import { Button, buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useRutaTienda } from "@/hooks/useRutaTienda"
import { useSesionEnTienda } from "@/hooks/useSesionEnTienda"
import { destinoTrasLogin } from "@/lib/destino-sesion"
import { cn } from "cn"

/** Aviso discreto cuando la sesión es de otra tienda (se navega como invitada). */
function SesionAjena({ compact }: { compact: boolean }) {
  const { user } = useAuth()
  if (!user) return null
  const donde = user.tenant?.nombre ?? "la plataforma"
  return (
    <p className={cn("text-xs text-muted-foreground", compact && "hidden xl:block")}>
      Tenés sesión en {donde} ·{" "}
      <Link to={destinoTrasLogin(user)} className="font-medium text-primary hover:underline">
        Ir a mi panel
      </Link>
    </p>
  )
}

/** Bloque de sesión/registro, compartido entre el nav desktop y el Sheet mobile. */
export function HeaderAuth({ compact = false }: { compact?: boolean }) {
  const { logout } = useAuth()
  const user = useSesionEnTienda()
  const ruta = useRutaTienda()

  if (!user) {
    return compact ? (
      <div className="hidden items-center gap-1 sm:flex">
        <SesionAjena compact />
        <Link
          to={ruta("/login")}
          className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Iniciar sesión
        </Link>
        <Link to={ruta("/registro")} className={cn(buttonVariants())}>
          Registrarse
        </Link>
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        <Link to={ruta("/registro")} className={cn(buttonVariants())}>
          Registrarse
        </Link>
        <Link to={ruta("/login")} className={cn(buttonVariants({ variant: "outline" }))}>
          Iniciar sesión
        </Link>
        <SesionAjena compact={false} />
      </div>
    )
  }

  const linkClass = cn(
    "rounded-lg text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
    compact ? "px-2.5 py-1.5" : "px-3 py-2.5 text-foreground"
  )
  // Cada rol de staff cae en una ruta que puede abrir (`destinoTrasLogin`):
  // `/admin` redirige a `/admin/catalogo`, que exige ADMIN exacto.
  const staffLabel: Record<string, string> = { ADMIN: "Panel admin", CAJERO: "Cobros", ENCARGADO_SUCURSAL: "Reportes" }
  const adminLink = staffLabel[user.role] && (
    <Link to={destinoTrasLogin(user)} className={linkClass}>
      {staffLabel[user.role]}
    </Link>
  )
  const links = (
    <>
      <Link to={ruta("/mis-pedidos")} className={linkClass}>
        Mis pedidos
      </Link>
      <Link to={ruta("/reservas")} className={linkClass}>
        Mis reservas
      </Link>
      {adminLink}
    </>
  )

  return compact ? (
    <div className="hidden items-center gap-3 sm:flex">
      {links}
      <span className="text-sm text-muted-foreground">Hola, {user.fullName.split(" ")[0]}</span>
      <Button variant="outline" onClick={logout}>
        Cerrar sesión
      </Button>
    </div>
  ) : (
    <div className="flex flex-col gap-2">
      {links}
      <Button variant="outline" onClick={logout}>
        Cerrar sesión
      </Button>
    </div>
  )
}
