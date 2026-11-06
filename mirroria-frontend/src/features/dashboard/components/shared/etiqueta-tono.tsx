import type { ReactNode } from "react"
import { CheckCircle, Circle, WarningCircle, XCircle, type Icon } from "@phosphor-icons/react"
import { cn } from "cn"

export type TonoEtiqueta = "bien" | "atencion" | "mal" | "neutro"

const TONOS: Record<TonoEtiqueta, { icon: Icon; clase: string }> = {
  bien: { icon: CheckCircle, clase: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700" },
  atencion: { icon: WarningCircle, clase: "border-amber-500/30 bg-amber-500/10 text-amber-700" },
  mal: { icon: XCircle, clase: "border-rose-500/25 bg-rose-500/10 text-rose-700" },
  neutro: { icon: Circle, clase: "border-border bg-muted/60 text-muted-foreground" },
}

/** Estado con ícono + palabra (el color nunca va solo). */
export function EtiquetaTono({ tono, children, className }: { tono: TonoEtiqueta; children: ReactNode; className?: string }) {
  const { icon: Icono, clase } = TONOS[tono]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap", clase, className)}>
      <Icono className="size-3 shrink-0" weight={tono === "neutro" ? "regular" : "fill"} />
      {children}
    </span>
  )
}
