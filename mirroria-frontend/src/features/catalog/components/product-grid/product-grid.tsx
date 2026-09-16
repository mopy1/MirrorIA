import { motion, useReducedMotion } from "motion/react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "cn"
import type { Categoria, Producto } from "../../types/catalog.types"
import { ProductCard } from "../product-card"

interface ProductGridProps {
  productos: Producto[]
  categorias: Categoria[]
  categoriaActivaId: string | null
  onSelectCategoria: (categoriaId: string | null) => void
  isLoading: boolean
}

export function ProductGrid({
  productos,
  categorias,
  categoriaActivaId,
  onSelectCategoria,
  isLoading,
}: ProductGridProps) {
  const reduce = useReducedMotion()

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <FilterPill
          label="Todo"
          active={categoriaActivaId === null}
          onClick={() => onSelectCategoria(null)}
        />
        {categorias.map((categoria) => (
          <FilterPill
            key={categoria.id}
            label={categoria.nombre}
            active={categoriaActivaId === categoria.id}
            onClick={() => onSelectCategoria(categoria.id)}
          />
        ))}
      </div>

      {isLoading ? (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      ) : productos.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted-foreground">
          No hay productos en esta categoría todavía.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {productos.map((producto, index) => (
            <motion.div
              key={producto.id}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: (index % 4) * 0.06 }}
            >
              <ProductCard producto={producto} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
      )}
    >
      {label}
    </button>
  )
}
