import { CheckCircle, Warning } from "@phosphor-icons/react"
import { motion, useReducedMotion } from "motion/react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ProductImagePlaceholder } from "@/components/common/ProductImagePlaceholder"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import { BranchPicker } from "@/features/branches/components/branch-picker"
import { useAuth } from "@/hooks/useAuth"
import { useCart } from "@/hooks/useCart"
import { formatMoney } from "@/lib/money"
import { cn } from "cn"
import { useDisponibilidad } from "@/features/inventory/hooks/useDisponibilidad"
import { ReservarEnTienda } from "@/features/reservations/components/reservar-en-tienda"
import type { Producto } from "../../types/catalog.types"
import { VariantSwatchGroup } from "./variant-swatch-group"

// Sin `orden` expuesto por variante (el backend solo lo tiene en /catalogo/tallas, no
// en VarianteResponseDto) — se ordena por nombre conocido en vez de dejarlo en el
// orden arbitrario en que se crearon las variantes.
const ORDEN_TALLAS = ["XS", "S", "M", "L", "XL", "XXL"]

function uniqueOptions(items: { id: string; nombre: string }[]) {
  const seen = new Set<string>()
  return items.filter((item) => (seen.has(item.id) ? false : seen.add(item.id)))
}

export function ProductDetail({ producto }: { producto: Producto }) {
  const reduce = useReducedMotion()
  const variantes = producto.variantes ?? []
  const tallas = uniqueOptions(variantes.map((v) => ({ id: v.tallaId, nombre: v.tallaNombre }))).sort(
    (a, b) => ORDEN_TALLAS.indexOf(a.nombre) - ORDEN_TALLAS.indexOf(b.nombre)
  )
  const colores = uniqueOptions(variantes.map((v) => ({ id: v.colorId, nombre: v.colorNombre })))

  const [tallaId, setTallaId] = useState<string | null>(null)
  const [colorId, setColorId] = useState<string | null>(null)
  const [sucursalId, setSucursalId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [imgError, setImgError] = useState(false)

  // Si solo hay una opción, no hay elección real que hacer — se preselecciona
  // para no exigir un clic innecesario antes de poder comprar.
  useEffect(() => {
    if (tallas.length === 1) setTallaId(tallas[0].id)
  }, [tallas])
  useEffect(() => {
    if (colores.length === 1) setColorId(colores[0].id)
  }, [colores])

  const variante = variantes.find((v) => v.tallaId === tallaId && v.colorId === colorId) ?? null
  const { cantidadDisponible, isLoading: stockLoading } = useDisponibilidad(
    variante?.id,
    sucursalId ?? undefined
  )

  const { isAuthenticated } = useAuth()
  const { addItem, isLoading: cartLoading } = useCart()
  const navigate = useNavigate()

  async function handleAddToCart() {
    if (!isAuthenticated) {
      navigate("/login")
      return
    }
    if (!variante) return
    setFeedback(null)
    await addItem(variante.id, 1)
    setFeedback("Se agregó al carrito.")
  }

  const sinStock = variante && sucursalId && cantidadDisponible === 0

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="overflow-hidden rounded-2xl bg-muted lg:sticky lg:top-24">
        {producto.imagenes?.[0]?.url && !imgError ? (
          <AspectRatio ratio={3 / 4}>
            <img
              src={producto.imagenes[0].url}
              alt={producto.titulo}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
          </AspectRatio>
        ) : (
          <ProductImagePlaceholder ratio={3 / 4} iconClassName="size-16" />
        )}
      </div>

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
          <p
            className={cn(
              "mt-3 flex items-center gap-1.5 text-sm",
              sinStock ? "text-destructive" : "text-foreground"
            )}
          >
            {sinStock ? <Warning className="size-4" /> : <CheckCircle className="size-4" />}
            {sinStock
              ? "Sin stock en esta sucursal"
              : `${cantidadDisponible} disponibles en esta sucursal`}
          </p>
        )}

        <Button
          size="lg"
          className="mt-6 w-full sm:w-auto"
          disabled={!variante || cartLoading || Boolean(sinStock)}
          onClick={handleAddToCart}
        >
          Agregar al carrito
        </Button>

        {feedback && (
          <p role="status" className="mt-3 text-sm text-foreground">
            {feedback}
          </p>
        )}

        <ReservarEnTienda varianteId={variante?.id ?? null} sucursalId={sucursalId} />
      </motion.div>
    </div>
  )
}
