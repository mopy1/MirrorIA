import { List, ShoppingBag, Receipt, CalendarBlank, SignOut, Storefront } from "@phosphor-icons/react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { LogoTiendaActual } from "@/components/marca/logo-tienda-actual"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/hooks/useAuth"
import { useCart } from "@/hooks/useCart"
import { useRutaTienda } from "@/hooks/useRutaTienda"
import { useSesionEnTienda } from "@/hooks/useSesionEnTienda"
import { destinoTrasLogin } from "@/lib/destino-sesion"

/** Sheet lateral deslizable con navegación y perfil para pantallas móviles. */
export function HeaderMobileDrawer() {
  const [abierto, setAbierto] = useState(false)
  const { itemCount } = useCart()
  const { logout } = useAuth()
  const user = useSesionEnTienda()
  const ruta = useRutaTienda()

  const cerrar = () => setAbierto(false)
  const esStaff = user && ["ADMIN", "CAJERO", "ENCARGADO_SUCURSAL"].includes(user.role)

  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Abrir menú" className="size-8.5 rounded-full lg:hidden"><List className="size-5" /></Button>} />
      <SheetContent side="right" className="flex w-72 flex-col justify-between p-5">
        <div className="space-y-6">
          <SheetHeader className="text-left pb-2 border-b border-border/40">
            <SheetTitle className="sr-only">Navegación Móvil</SheetTitle>
            <div onClick={cerrar}><LogoTiendaActual /></div>
          </SheetHeader>
          <nav className="flex flex-col gap-1 text-sm font-medium">
            <Link to={ruta("/tienda")} onClick={cerrar} className="rounded-lg px-3 py-2 text-foreground/80 hover:bg-muted hover:text-foreground">Colección</Link>
            <Link to={ruta("/probador")} onClick={cerrar} className="flex items-center justify-between rounded-lg px-3 py-2 text-foreground/80 hover:bg-muted hover:text-foreground">
              <span>Probador IA</span><span className="rounded-full bg-brand-accent/15 px-1.5 py-0.5 text-[9px] font-semibold text-brand-accent">IA</span>
            </Link>
            <Link to={ruta("/sucursales")} onClick={cerrar} className="rounded-lg px-3 py-2 text-foreground/80 hover:bg-muted hover:text-foreground">Sucursales</Link>
            <Link to={ruta("/carrito")} onClick={cerrar} className="flex items-center justify-between rounded-lg px-3 py-2 text-foreground/80 hover:bg-muted hover:text-foreground">
              <span className="flex items-center gap-2"><ShoppingBag className="size-4" /> Bolsa de compras</span>
              {itemCount > 0 && <Badge className="bg-brand-accent text-brand-accent-foreground text-[10px] h-4 min-w-4 px-1">{itemCount}</Badge>}
            </Link>
          </nav>
        </div>
        <div className="space-y-4 pt-4 border-t border-border/40 text-xs">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Avatar size="sm"><AvatarFallback className="bg-primary/10 text-[10px] text-primary">{user.fullName[0]}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1"><p className="font-semibold text-foreground truncate">{user.fullName}</p><p className="text-[10px] text-muted-foreground truncate">{user.email}</p></div>
              </div>
              <div className="flex flex-col gap-1">
                <Link to={ruta("/mis-pedidos")} onClick={cerrar} className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Receipt className="size-3.5" /> Mis pedidos</Link>
                <Link to={ruta("/reservas")} onClick={cerrar} className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><CalendarBlank className="size-3.5" /> Mis reservas de probador</Link>
                {esStaff && <Link to={destinoTrasLogin(user)} onClick={cerrar} className="flex items-center gap-2 rounded-md px-2.5 py-1.5 font-medium text-primary hover:bg-primary/10"><Storefront className="size-3.5" /> Panel de control</Link>}
                <button onClick={() => { logout(); cerrar() }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-destructive hover:bg-destructive/10 text-left cursor-pointer"><SignOut className="size-3.5" /> Cerrar sesión</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link to={ruta("/registro")} onClick={cerrar} className="rounded-full bg-foreground py-2 text-center font-medium text-background">Registrarse</Link>
              <Link to={ruta("/login")} onClick={cerrar} className="rounded-full border border-border py-2 text-center font-medium text-foreground">Iniciar sesión</Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
