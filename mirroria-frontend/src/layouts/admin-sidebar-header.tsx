import { X } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { cn } from "cn"
import { LogoTienda } from "@/components/marca/logo-tienda"
import { Button } from "@/components/ui/button"

interface Props {
  tiendaNombre: string
  logoUrl: string | null
  subtitulo: string
  tiendaHref: string
  /** Solo el logo, centrado (menú contraído). */
  colapsado?: boolean
  onNavigate?: () => void
}

/** Cabecera del sidebar del panel: logo (o monograma), nombre de la tienda y plan (el rol va al pie, para no recortar el nombre). */
export function AdminSidebarHeader({ tiendaNombre, logoUrl, subtitulo, tiendaHref, colapsado = false, onNavigate }: Props) {
  return (
    <div className={cn("flex h-16 shrink-0 items-center gap-2 border-b border-border/60", colapsado ? "justify-center px-2" : "justify-between px-4")}>
      <Link
        to={tiendaHref}
        onClick={onNavigate}
        title={tiendaNombre}
        aria-label={colapsado ? `Ver ${tiendaNombre}` : undefined}
        className="flex min-w-0 items-center gap-2.5 rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <LogoTienda nombre={tiendaNombre} logoUrl={logoUrl} conNombre={false} className={cn(colapsado && "[&_img]:max-w-10")} />
        {!colapsado && (
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold text-foreground">{tiendaNombre}</span>
            <span className="truncate text-[11px] text-muted-foreground">{subtitulo}</span>
          </span>
        )}
      </Link>
      {onNavigate && (
        <Button variant="ghost" size="sm" onClick={onNavigate} aria-label="Cerrar menú" className="size-7 shrink-0 p-0 text-muted-foreground hover:text-foreground">
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  )
}
