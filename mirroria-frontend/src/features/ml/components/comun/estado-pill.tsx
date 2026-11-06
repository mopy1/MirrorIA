import type { ReactNode } from "react"
import { CheckCircle, Warning, WarningCircle, WarningOctagon, type Icon } from "@phosphor-icons/react"
import { cn } from "cn"
import type { Tono } from "../../lib/ml-lenguaje"

const TONOS: Record<Tono, { icon: Icon; cls: string }> = {
  bien: { icon: CheckCircle, cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  atencion: { icon: Warning, cls: "bg-amber-500/12 text-amber-800 dark:text-amber-300" },
  alerta: { icon: WarningCircle, cls: "bg-orange-500/12 text-orange-800 dark:text-orange-300" },
  critico: { icon: WarningOctagon, cls: "bg-rose-500/10 text-rose-700 dark:text-rose-400" },
}

/** Estado en palabras con ícono: el color nunca va solo. */
export function EstadoPill({ tono, children, className }: { tono: Tono; children: ReactNode; className?: string }) {
  const { icon: Icono, cls } = TONOS[tono]
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        cls,
        className,
      )}
    >
      <Icono className="size-3.5" weight="fill" aria-hidden />
      {children}
    </span>
  )
}
