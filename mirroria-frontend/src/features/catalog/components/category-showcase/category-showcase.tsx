import { ArrowUpRight, CoatHanger } from "@phosphor-icons/react"
import { motion, useReducedMotion } from "motion/react"
import { Link } from "react-router-dom"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Skeleton } from "@/components/ui/skeleton"
import { estadoDeLista } from "@/lib/estado-de-lista"
import { useCategorias } from "../../hooks/useCategorias"
import { useProductos } from "../../hooks/useProductos"

export function CategoryShowcase() {
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
          to="/tienda"
          className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
        >
          Ver todo el catálogo
          <ArrowUpRight className="size-4" weight="bold" />
        </Link>
      </div>

      {/* Sin categorias la grilla no dibujaba NADA y el titulo quedaba flotando
          sobre un hueco mudo. Es el estado real de una tienda recien
          desplegada, asi que se dice en palabras. */}
      {/* La grilla va a 6 columnas porque el catalogo tiene 6 categorias: con 5,
          "Vestidos" quedaba sola en una segunda fila. */}
      {estado === "vacio" ? (
        <p className="mt-16 text-center text-sm text-muted-foreground">
          Todavía no hay categorías cargadas.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {estado === "cargando"
          ? Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))
          : categorias.map((categoria, index) => {
              const producto = productos.find(
                (p) => p.categoriaId === categoria.id && p.imagenes?.[0]?.url
              )
              const imagenUrl = producto?.imagenes?.[0]?.url

              return (
                <motion.div
                  key={categoria.id}
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
                >
                  <Link
                    to={`/tienda?categoria=${categoria.id}`}
                    className="group relative block overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <AspectRatio ratio={3 / 4}>
                      {imagenUrl ? (
                        <img
                          src={imagenUrl}
                          alt={categoria.nombre}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <>
                          <div
                            className="h-full w-full bg-muted transition-transform duration-500 ease-out group-hover:scale-105"
                            style={{
                              backgroundImage:
                                "radial-gradient(circle at 70% 25%, color-mix(in oklch, var(--primary) 14%, transparent), transparent 55%)",
                            }}
                          />
                          <CoatHanger
                            weight="light"
                            className="absolute top-1/3 left-1/2 size-9 -translate-x-1/2 -translate-y-1/2 text-foreground/15"
                          />
                        </>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/0 transition-colors duration-300 group-hover:from-black/90" />

                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-medium text-white leading-tight">
                            {categoria.nombre}
                          </p>
                          {producto && (
                            <p className="text-xs text-white/75 truncate font-normal">
                              {producto.titulo}
                            </p>
                          )}
                        </div>
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                          <ArrowUpRight className="size-4" weight="bold" />
                        </span>
                      </div>
                    </AspectRatio>
                  </Link>
                </motion.div>
              )
            })}
        </div>
      )}
    </section>
  )
}
