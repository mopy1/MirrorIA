import { Link } from "react-router-dom"
import { Button, buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "cn"

/** Bloque de sesión/registro, compartido entre el nav desktop y el Sheet mobile. */
export function HeaderAuth({ compact = false }: { compact?: boolean }) {
  const { user, isAuthenticated, logout } = useAuth()

  if (!isAuthenticated) {
    return compact ? (
      <div className="hidden items-center gap-1 sm:flex">
        <Link
          to="/login"
          className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Iniciar sesión
        </Link>
        <Link to="/register" className={cn(buttonVariants())}>
          Registrarse
        </Link>
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        <Link to="/register" className={cn(buttonVariants())}>
          Registrarse
        </Link>
        <Link to="/login" className={cn(buttonVariants({ variant: "outline" }))}>
          Iniciar sesión
        </Link>
      </div>
    )
  }

  const linkClass = cn(
    "rounded-lg text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
    compact ? "px-2.5 py-1.5" : "px-3 py-2.5 text-foreground"
  )
  const adminLink = user?.role === "ADMIN" && (
    <Link to="/admin" className={linkClass}>
      Panel admin
    </Link>
  )
  const reservasLink = (
    <Link to="/reservas" className={linkClass}>
      Mis reservas
    </Link>
  )

  return compact ? (
    <div className="hidden items-center gap-3 sm:flex">
      {reservasLink}
      {adminLink}
      <span className="text-sm text-muted-foreground">Hola, {user!.fullName.split(" ")[0]}</span>
      <Button variant="outline" onClick={logout}>
        Cerrar sesión
      </Button>
    </div>
  ) : (
    <div className="flex flex-col gap-2">
      {reservasLink}
      {adminLink}
      <Button variant="outline" onClick={logout}>
        Cerrar sesión
      </Button>
    </div>
  )
}
