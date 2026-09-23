import { memo } from "react"
import type { Producto } from "@/features/catalog/types/catalog.types"

function TiraDePrendasBase({
  prendas,
  elegidaId,
  fallidas,
  onElegir,
}: {
  prendas: Producto[]
  elegidaId: string | null
  /** Ids cuyo recorte ya dio error: se muestran atenuados y no se pueden
   * volver a elegir, en vez de fallar en silencio otra vez. */
  fallidas?: ReadonlySet<string>
  onElegir: (p: Producto) => void
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {prendas.map((p) => {
        const fallo = fallidas?.has(p.id) ?? false
        return (
          <button
            key={p.id}
            type="button"
            disabled={fallo}
            onClick={() => onElegir(p)}
            title={fallo ? "Esta prenda no se pudo cargar" : undefined}
            className={`shrink-0 overflow-hidden rounded-xl border-2 text-left disabled:cursor-not-allowed disabled:opacity-40 ${
              p.id === elegidaId ? "border-primary" : "border-transparent"
            }`}
          >
            <img src={p.imagenes?.[0]?.url} alt="" className="h-24 w-20 object-cover" loading="lazy" />
            <span className="block max-w-20 truncate px-1 py-1 text-xs">{p.titulo}</span>
          </button>
        )
      })}
    </div>
  )
}

// Memoizada: sin esto, cada uno de los ~30 renders por segundo que dispara
// `usePose` reconciliaba toda la tira de miniaturas de nuevo.
export const TiraDePrendas = memo(TiraDePrendasBase)
