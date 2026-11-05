import { PaintBrush } from "@phosphor-icons/react"
import { Link } from "react-router-dom"
import { NIVELES } from "@/lib/tema/marca.constants"
import type { NivelMarca } from "@/types/marca.types"

/** "Tu plan incluye: ..." con acceso contextual a Apariencia (spec §C.1). */
export function IncluyeMarca({ nivel }: { nivel: NivelMarca }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4">
      <p className="flex items-center gap-2.5 text-sm">
        <PaintBrush className="size-5 text-primary" />
        <span><span className="font-medium">Tu plan incluye:</span> {NIVELES[nivel].resumen}.</span>
      </p>
      <Link to="/admin/apariencia" className="text-sm font-medium text-primary underline-offset-4 hover:underline">Personalizar mi tienda</Link>
    </div>
  )
}
