import { Link } from "react-router-dom"
import { cn } from "cn"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { NavItem } from "./admin-sidebar.data"

interface Props {
  item: NavItem
  activo: boolean
  /** Solo ícono + tooltip (menú contraído de escritorio). */
  colapsado?: boolean
  onNavigate?: () => void
}

const BASE =
  "group/item relative flex items-center rounded-md text-sm outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/60"

// Activo sobrio: tinte del color de la tienda + ícono relleno; el texto sigue en
// `foreground` para no depender del contraste del `--primary` de cada marca.
const estado = (activo: boolean) =>
  activo ? "bg-primary/10 font-medium text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"

/** Un link del menú lateral, en su versión completa o de solo ícono. */
export function AdminSidebarItem({ item, activo, colapsado = false, onNavigate }: Props) {
  const Icon = item.icon
  const icono = (
    <Icon
      weight={activo ? "fill" : "regular"}
      className={cn("size-4 shrink-0", activo ? "text-primary" : "text-muted-foreground group-hover/item:text-foreground")}
    />
  )
  const nombre = item.badge ? `${item.label} (${item.badge})` : item.label

  if (colapsado) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              to={item.href}
              onClick={onNavigate}
              aria-label={nombre}
              aria-current={activo ? "page" : undefined}
              className={cn(BASE, estado(activo), "mx-auto size-9 justify-center")}
            >
              {icono}
              {item.badge && <span aria-hidden className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-amber-500" />}
            </Link>
          }
        />
        <TooltipContent side="right" sideOffset={10}>
          {item.badge ? `${item.label} · ${item.badge}` : item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      aria-current={activo ? "page" : undefined}
      className={cn(BASE, estado(activo), "h-8 gap-2.5 px-2.5")}
    >
      {icono}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums bg-amber-500/15 text-amber-800 dark:text-amber-300">
          {item.badge}
        </span>
      )}
    </Link>
  )
}
