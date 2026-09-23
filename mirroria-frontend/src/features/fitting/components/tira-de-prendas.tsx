import type { Producto } from "@/features/catalog/types/catalog.types"

export function TiraDePrendas({
  prendas,
  elegidaId,
  onElegir,
}: {
  prendas: Producto[]
  elegidaId: string | null
  onElegir: (p: Producto) => void
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {prendas.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onElegir(p)}
          className={`shrink-0 overflow-hidden rounded-xl border-2 text-left ${
            p.id === elegidaId ? "border-primary" : "border-transparent"
          }`}
        >
          <img src={p.imagenes?.[0]?.url} alt="" className="h-24 w-20 object-cover" loading="lazy" />
          <span className="block max-w-20 truncate px-1 py-1 text-xs">{p.titulo}</span>
        </button>
      ))}
    </div>
  )
}
