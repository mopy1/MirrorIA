import { ArrowSquareOut, CaretUpDown, SignOut } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { cn } from "cn"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/useAuth"

function iniciales(nombre?: string): string {
  if (!nombre?.trim()) return "AD"
  const partes = nombre.trim().split(/\s+/)
  return partes.length === 1 ? partes[0].slice(0, 2).toUpperCase() : (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

interface Props {
  rolLabel: string
  tiendaHref: string
  /** Solo el avatar (menú contraído). */
  colapsado?: boolean
  onNavigate?: () => void
}

/** Quién está en el panel (avatar + nombre + rol) con su menú: ver la tienda y cerrar sesión. */
export function AdminSidebarUsuarioMenu({ rolLabel, tiendaHref, colapsado = false, onNavigate }: Props) {
  const { user, logout } = useAuth()
  const nombre = user?.fullName || "Administrador"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Cuenta de ${nombre}, ${rolLabel}`}
        className={cn(
          "flex items-center rounded-md text-left outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60 data-popup-open:bg-muted",
          colapsado ? "mx-auto size-10 justify-center" : "w-full gap-2.5 p-1.5",
        )}
      >
        <Avatar size="sm" className="size-7">
          <AvatarFallback className="bg-primary/10 text-[11px] font-medium text-primary">{iniciales(user?.fullName)}</AvatarFallback>
        </Avatar>
        {!colapsado && (
          <>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-sm font-medium text-foreground">{nombre}</span>
              <span className="truncate text-xs text-muted-foreground">{rolLabel}</span>
            </span>
            <CaretUpDown aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={colapsado ? "right" : "top"} align={colapsado ? "end" : "start"} className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 py-1.5">
            <span className="truncate text-sm font-medium text-foreground">{nombre}</span>
            {user?.email && <span className="truncate font-normal">{user.email}</span>}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to={tiendaHref} onClick={onNavigate} />}>
          <ArrowSquareOut />
          Ver mi tienda
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={logout}>
          <SignOut />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
