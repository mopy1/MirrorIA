import { ArrowUpRight } from "@phosphor-icons/react"
import { motion, useReducedMotion } from "motion/react"
import { Link } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { estadoDeLista } from "@/lib/estado-de-lista"
import { cn } from "cn"
import { CategoryCard } from "./category-card"
import { columnasParaCategorias } from "./columnas"
import { useCategorias } from "../../hooks/useCategorias"
import { useProductos } from "../../hooks/useProductos"
import { useRutaTienda } from "@/hooks/useRutaTienda"

export function CategoryShowcase() {
  const ruta = useRutaTienda()
  const reduce = useReducedMotion()
  const { categorias, isLoading: loadingCategorias } = useCategorias()
  const { productos, isLoading: loadingProductos } = useProductos()

  const isLoading = loadingCategorias || loadingProductos
  const estado = estadoDeLista({ isLoading, cantidad: categorias.length })

  return (
    <section id="categorias" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">
            Colección activa
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl text-foreground">
            Explorá por categoría
          </h2>
        </div>
        <Link
          to={ruta("/tienda")}
          className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
        >
          Ver todo el catálogo
          <ArrowUpRight className="size-4" weight="bold" />
        </Link>
      </div>

      {/* Sin categorias la grilla no dibujaba NADA y el titulo quedaba flotando
          sobre un hueco mudo. Es el estado real de una tienda recien
          desplegada, asi que se dice en palabras. */}
      {estado === "vacio" ? (
        <p className="mt-16 text-center text-sm text-muted-foreground">
          Todavía no hay categorías cargadas.
        </p>
      ) : (
        <div
          className={cn(
            "grid grid-cols-2 gap-4 sm:grid-cols-3",
            columnasParaCategorias(categorias.length)
          )}
        >
          {estado === "cargando"
          ? Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))
          : categorias.map((categoria, index) => {
              const producto = productos.find(
                (p) => p.categoriaId === categoria.id && p.imagenes?.[0]?.url
              )

              return (
                <motion.div
                  key={categoria.id}
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
                >
                  <CategoryCard categoria={categoria} producto={producto} href={ruta(`/tienda?categoria=${categoria.id}`)} />
                </motion.div>
              )
            })}
        </div>
      )}
    </section>
  )
}
