import { motion, useReducedMotion } from "motion/react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { BranchPicker } from "@/features/branches/components/branch-picker"
import { formatMoney } from "@/lib/money"
import { useDisponibilidad } from "@/features/inventory/hooks/useDisponibilidad"
import { ReservarEnTienda } from "@/features/reservations/components/reservar-en-tienda"
import type { Producto } from "../../types/catalog.types"
import { EstadoStock } from "./estado-stock"
import { ProductImage } from "./product-image"
import { useAgregarAlCarrito } from "./useAgregarAlCarrito"
import { useSeleccionVariante } from "./useSeleccionVariante"
import { VariantSwatchGroup } from "./variant-swatch-group"
import { useRutaTienda } from "@/hooks/useRutaTienda"

export function ProductDetail({ producto }: { producto: Producto }) {
  const ruta = useRutaTienda()
  const reduce = useReducedMotion()
  const { tallas, colores, tallaId, colorId, setTallaId, setColorId, variante } = useSeleccionVariante(producto)
  const [sucursalId, setSucursalId] = useState<string | null>(null)
  const { cantidadDisponible, isLoading: stockLoading } = useDisponibilidad(
    variante?.id,
    sucursalId ?? undefined
  )

  const { agregar, isLoading: cartLoading, feedback, error: cartError } = useAgregarAlCarrito()

  const sinStock = variante && sucursalId && cantidadDisponible === 0

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <ProductImage producto={producto} />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {producto.titulo}
        </h1>
        <p className="mt-2 text-xl text-foreground">{formatMoney(producto.precioCents)}</p>
        {producto.descripcion && (
          <p className="mt-4 max-w-prose text-sm text-muted-foreground">{producto.descripcion}</p>
        )}

        <VariantSwatchGroup label="Talla" options={tallas} selectedId={tallaId} onSelect={setTallaId} />
        <VariantSwatchGroup label="Color" options={colores} selectedId={colorId} onSelect={setColorId} />

        <div className="mt-6">
          <BranchPicker
            value={sucursalId}
            onChange={setSucursalId}
            label="Consultar disponibilidad en"
          />
        </div>

        {variante && sucursalId && !stockLoading && (
          <EstadoStock cantidadDisponible={cantidadDisponible ?? 0} />
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            size="lg"
            className="w-full sm:w-auto"
            disabled={!variante || cartLoading || Boolean(sinStock)}
            onClick={() => agregar(variante?.id)}
          >
            Agregar al carrito
          </Button>

          {/* El probador web (Decart VTON) usa la foto real del producto:
              cualquier producto con al menos una foto se puede probar. */}
          {(producto.imagenes?.length ?? 0) > 0 && (
            <Link to={ruta(`/probador/${producto.id}`)}>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Probármela
              </Button>
            </Link>
          )}
        </div>

        {feedback && (
          <p role="status" className="mt-3 text-sm text-foreground">
            {feedback}
          </p>
        )}
        {cartError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {cartError}
          </p>
        )}

        <ReservarEnTienda varianteId={variante?.id ?? null} sucursalId={sucursalId} />
      </motion.div>
    </div>
  )
}
