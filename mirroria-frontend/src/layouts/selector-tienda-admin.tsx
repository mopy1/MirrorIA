import { useState } from "react"
import { CaretDown, Check, Storefront, SpinnerGap } from "@phosphor-icons/react"
import { authApi } from "@/features/auth/api/authApi"
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

interface TiendaDemoOption {
  slug: string
  nombre: string
  email: string
}

const TIENDAS_DEMO: TiendaDemoOption[] = [
  { slug: "tiendaria", nombre: "Tiendaria", email: "admin@mirroria.com" },
  { slug: "casa-andina", nombre: "Casa Andina", email: "rosa@casa-andina.bo" },
  { slug: "nomada", nombre: "Nómada Urbana", email: "camila@nomada.bo" },
]

export function SelectorTiendaAdmin() {
  const { user, login } = useAuth()
  const [cambiando, setCambiando] = useState(false)
  const currentSlug = user?.tenant?.slug ?? "tiendaria"
  const currentNombre = user?.tenant?.nombre ?? "Tiendaria"

  const cambiarTienda = async (tienda: TiendaDemoOption) => {
    if (tienda.slug === currentSlug || cambiando) return
    setCambiando(true)
    try {
      // Login directo con las credenciales sembradas de admin de la tienda
      const auth = await authApi.login({ email: tienda.email, password: "Mirroria2026!" }, false)
      login(auth)
      // Recargar para limpiar caches de react-query y re-derivar el tema de la tienda
      window.location.reload()
    } catch {
      setCambiando(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            disabled={cambiando}
            className="h-8 gap-1.5 px-2 text-xs font-medium text-foreground hover:bg-muted"
            title="Cambiar de tienda (Modo Multi-Tenant Demo)"
          >
            {cambiando ? (
              <SpinnerGap className="size-3.5 animate-spin text-primary" />
            ) : (
              <Storefront className="size-3.5 text-primary" weight="duotone" />
            )}
            <span className="font-semibold">{currentNombre}</span>
            <CaretDown className="size-3 text-muted-foreground" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-56 text-xs">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
            Cambiar panel de administración:
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {TIENDAS_DEMO.map((t) => {
          const esActiva = t.slug === currentSlug
          return (
            <DropdownMenuItem
              key={t.slug}
              onClick={() => void cambiarTienda(t)}
              className="flex items-center justify-between py-1.5 cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{t.nombre}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{t.email}</span>
              </div>
              {esActiva && <Check className="size-3.5 text-primary" weight="bold" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
