import { Collapsible } from "@base-ui/react/collapsible"
import { CaretDown } from "@phosphor-icons/react"
import { cn } from "cn"
import type { NavGroup } from "./admin-sidebar.data"
import { AdminSidebarItem } from "./admin-sidebar-item"
import { esRutaActiva } from "./admin-sidebar-logica"

interface Props {
  group: NavGroup
  pathname: string
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  onNavigate?: () => void
}

/** Un grupo del acordeón: encabezado `<button aria-expanded>` + items con animación de altura. */
export function AdminSidebarGrupo({ group, pathname, abierto, onAbiertoChange, onNavigate }: Props) {
  const Icon = group.icon
  const contieneActiva = group.items.some((i) => esRutaActiva(pathname, i.href))
  const tieneBadge = group.items.some((i) => i.badge)
  // Cerrado pero con algo que mirar adentro: un punto lo avisa sin abrirlo.
  const aviso = !abierto && (contieneActiva || tieneBadge)

  return (
    <Collapsible.Root open={abierto} onOpenChange={onAbiertoChange}>
      <Collapsible.Trigger
        className={cn(
          "group/grupo flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] font-semibold text-foreground/80 outline-none",
          "transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60",
        )}
      >
        <Icon className="size-4 shrink-0 text-muted-foreground group-hover/grupo:text-foreground" />
        <span className="min-w-0 flex-1 truncate text-left">{group.title}</span>
        {aviso && (
          <span
            className={cn("size-1.5 shrink-0 rounded-full", contieneActiva ? "bg-primary" : "bg-amber-500")}
            aria-label={contieneActiva ? "Contiene la página actual" : "Tiene un aviso"}
            role="img"
          />
        )}
        <CaretDown
          aria-hidden
          className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-data-[panel-open]/grupo:rotate-0 -rotate-90 motion-reduce:transition-none"
        />
      </Collapsible.Trigger>
      <Collapsible.Panel
        className={cn(
          "h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out",
          "data-starting-style:h-0 data-ending-style:h-0 motion-reduce:transition-none",
        )}
      >
        {/* Guía de 1px que ata los items a su grupo (tipo árbol). */}
        <div className="mt-0.5 mb-1 ml-[1.0625rem] space-y-0.5 border-l border-border/70 pl-2">
          {group.items.map((item) => (
            <AdminSidebarItem key={item.href} item={item} activo={esRutaActiva(pathname, item.href)} onNavigate={onNavigate} />
          ))}
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}
