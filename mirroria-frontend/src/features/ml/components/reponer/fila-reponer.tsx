import type { ItemPrediccionDemanda } from "../../types/ml.types"
import { estadoStock } from "../../lib/ml-lenguaje"
import { textoDuracion, textoReposicion } from "../../lib/ml-demanda"
import { EstadoPill } from "../comun/estado-pill"

interface FilaReponerProps {
  item: ItemPrediccionDemanda
  nombre: string
  horizonteDias: number
  /** Valor máximo de la lista, para que todas las barras usen la misma escala. */
  escala: number
}

function Barra({ valor, escala, className }: { valor: number; escala: number; className: string }) {
  const ancho = escala > 0 ? Math.max(valor > 0 ? 2 : 0, (valor / escala) * 100) : 0
  return (
    <div className="h-1.5 w-full rounded-full bg-muted">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${ancho}%` }} />
    </div>
  )
}

/** Una prenda: cuánto tenés vs. cuánto vas a vender, el riesgo en palabras y cuánto pedir. */
export function FilaReponer({ item, nombre, horizonteDias, escala }: FilaReponerProps) {
  const estado = estadoStock(item.riesgo_quiebre)
  return (
    <li className="space-y-2 py-3">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <span className="min-w-0 text-sm font-medium text-foreground">{nombre}</span>
        <EstadoPill tono={estado.tono}>{estado.etiqueta}</EstadoPill>
      </div>
      <div className="grid max-w-xl gap-0.5" aria-hidden>
        <Barra valor={item.stock_actual} escala={escala} className="bg-muted-foreground/45" />
        <Barra valor={item.demanda_proyectada_unidades} escala={escala} className="bg-primary" />
      </div>
      <p className="text-sm text-muted-foreground tabular-nums text-pretty">
        {textoReposicion(item, horizonteDias)}
        <span className="text-foreground/80"> · {textoDuracion(item, horizonteDias)}</span>
      </p>
    </li>
  )
}
