import { X } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { LogoTienda } from "@/components/marca/logo-tienda"
import { Button } from "@/components/ui/button"

interface Props {
  tiendaNombre: string
  logoUrl: string | null
  subtitulo: string
  tiendaHref: string
  onNavigate?: () => void
}

/** Cabecera del sidebar del panel: logo (o monograma), nombre de la tienda y plan (el rol va al pie, para no recortar el nombre). */
export function AdminSidebarHeader({ tiendaNombre, logoUrl, subtitulo, tiendaHref, onNavigate }: Props) {
  return (
    <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/60 px-5">
      <Link to={tiendaHref} onClick={onNavigate} title={tiendaNombre} className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-90">
        <LogoTienda nombre={tiendaNombre} logoUrl={logoUrl} conNombre={false} />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold text-foreground">{tiendaNombre}</span>
          <span className="truncate text-[11px] text-muted-foreground">{subtitulo}</span>
        </span>
      </Link>
      {onNavigate && (
        <Button variant="ghost" size="sm" onClick={onNavigate} className="size-7 shrink-0 p-0 text-muted-foreground hover:text-foreground">
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  )
}
