import { Suspense } from "react"
import { Outlet } from "react-router-dom"
import { PageFallback } from "@/components/common/PageFallback"
import { CartProvider } from "@/context/CartContext"
import { TenantProvider } from "@/context/TenantContext"
import { StorefrontLayout } from "./StorefrontLayout"

/**
 * Raíz de `/t/:slug/*`: resuelve la tienda (TenantProvider, 4 estados) y le
 * cuelga el carrito de la sesión de ESA tienda. Envuelve también login y
 * registro (que usan AuthLayout, no el header de la tienda).
 */
export function TiendaRoot() {
  return (
    <TenantProvider>
      <CartProvider>
        <Outlet />
      </CartProvider>
    </TenantProvider>
  )
}

/** Header + footer de la tienda alrededor de las páginas de `/t/:slug/*`. */
export function TiendaLayout() {
  return (
    <StorefrontLayout>
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
    </StorefrontLayout>
  )
}
