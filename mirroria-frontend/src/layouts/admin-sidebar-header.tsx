import { X } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { BrandLogo } from "@/components/brand-logo"
import { Button } from "@/components/ui/button"

interface Props {
  tiendaNombre: string
  subtitulo: string
  tiendaHref: string
  onNavigate?: () => void
}

/** Cabecera del sidebar del panel: nombre de la tienda y plan (el rol va al pie, para no recortar el nombre). */
export function AdminSidebarHeader({ tiendaNombre, subtitulo, tiendaHref, onNavigate }: Props) {
  return (
    <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/60 px-5">
      <Link to={tiendaHref} onClick={onNavigate} title={tiendaNombre} className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-90">
        <BrandLogo size="default" withText={false} />
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
