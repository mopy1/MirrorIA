import { ArrowUpRight } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import type { TiendaPublica } from "@/types/tienda.types"

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/)
  return (partes.length === 1 ? partes[0].slice(0, 2) : partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

export function TiendaCard({ tienda }: { tienda: TiendaPublica }) {
  return (
    <Link
      to={`/t/${tienda.slug}`}
      className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
        {iniciales(tienda.nombre)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-foreground">{tienda.nombre}</span>
        <span className="block truncate font-mono text-xs text-muted-foreground">/t/{tienda.slug}</span>
      </span>
      <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
    </Link>
  )
}
