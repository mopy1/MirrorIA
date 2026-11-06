import { Receipt, CalendarBlank, SignOut, Storefront } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/useAuth"
import { useRutaTienda } from "@/hooks/useRutaTienda"
import { useSesionEnTienda } from "@/hooks/useSesionEnTienda"
import { destinoTrasLogin } from "@/lib/destino-sesion"

/** Menú de usuario desplegable con avatar, links a cuenta, panel staff y logout. */
export function HeaderUserDropdown() {
  const { logout } = useAuth()
  const user = useSesionEnTienda()
  const ruta = useRutaTienda()

  if (!user) {
    return (
      <div className="hidden items-center gap-2 sm:flex">
        <Link
          to={ruta("/login")}
          className="rounded-md px-2.5 py-1.5 text-xs font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground"
        >
          Iniciar sesión
        </Link>
        <Link
          to={ruta("/registro")}
          className="rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium tracking-wide text-background transition-opacity hover:opacity-90 shadow-xs"
        >
          Registrarse
        </Link>
      </div>
    )
  }

  const iniciales = user.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"

  const esStaff = ["ADMIN", "CAJERO", "ENCARGADO_SUCURSAL"].includes(user.role)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8.5 rounded-full ring-1 ring-border/60 hover:ring-border transition-all"
            aria-label="Abrir menú de usuario"
          >
            <Avatar size="sm" className="size-7.5">
              <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                {iniciales}
              </AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-xl">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2.5 py-2">
            <p className="text-xs font-semibold text-foreground truncate">{user.fullName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link to={ruta("/mis-pedidos")} className="flex w-full items-center gap-2 px-2 py-1.5 text-xs cursor-pointer rounded-md hover:bg-muted" />}>
            <Receipt className="size-4 text-muted-foreground" />
            <span>Mis pedidos</span>
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link to={ruta("/reservas")} className="flex w-full items-center gap-2 px-2 py-1.5 text-xs cursor-pointer rounded-md hover:bg-muted" />}>
            <CalendarBlank className="size-4 text-muted-foreground" />
            <span>Mis reservas de probador</span>
          </DropdownMenuItem>
          {esStaff && (
            <DropdownMenuItem render={<Link to={destinoTrasLogin(user)} className="flex w-full items-center gap-2 px-2 py-1.5 text-xs font-medium text-primary cursor-pointer rounded-md hover:bg-primary/10" />}>
              <Storefront className="size-4 text-primary" />
              <span>Panel de control</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={logout}
          className="flex w-full items-center gap-2 px-2 py-1.5 text-xs cursor-pointer text-destructive focus:text-destructive rounded-md"
        >
          <SignOut className="size-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
