import type { ComponentType } from "react"
import type { UsuarioRole } from "@/features/auth/types/auth.types"
import { BranchesPage } from "@/features/branches/pages/BranchesPage"
import { CartPage } from "@/features/cart/pages/CartPage"
import { HomePage } from "@/features/catalog/pages/HomePage"
import { ProductDetailPage } from "@/features/catalog/pages/ProductDetailPage"
import { ProductListPage } from "@/features/catalog/pages/ProductListPage"
import { CheckoutPage } from "@/features/checkout/pages/CheckoutPage"
import { NotFoundPage } from "@/features/errors/pages/NotFoundPage"
import { MyOrdersPage } from "@/features/orders/pages/MyOrdersPage"
import { PagoPage } from "@/features/payments/pages/PagoPage"
import { MyReservationsPage } from "@/features/reservations/pages/MyReservationsPage"
import {
  ActivarPlanPage, AparienciaAdminPage, CatalogoAdminPage, CobrosAdminPage, CuponesAdminPage, DashboardAdminPage, InventarioAdminPage, MlDashboardPage, ProbadorPage, ProveedoresAdminPage,
  ReportesAdminPage, ReservasAdminPage, SucursalesAdminPage, SuscripcionAdminPage, UsuariosAdminPage, VentasAdminPage,
} from "./lazy-pages"

// Rutas de la tienda, RELATIVAS a /t/:slug (Regla 1.B.3: puro path+componente;
// la única variación es `protected`, que pide sesión de ESTA tienda).
export const TIENDA_ROUTES: { path: string; Component: ComponentType; protected?: boolean }[] = [
  { path: "tienda", Component: ProductListPage },
  { path: "tienda/producto/:id", Component: ProductDetailPage },
  { path: "sucursales", Component: BranchesPage },
  { path: "carrito", Component: CartPage, protected: true },
  { path: "checkout", Component: CheckoutPage, protected: true },
  // Las 3 rutas de pago renderizan la misma página (PagoPage mira el pathname).
  { path: "pago/:ventaId", Component: PagoPage, protected: true },
  { path: "pago/exito", Component: PagoPage, protected: true },
  { path: "pago/cancelado", Component: PagoPage, protected: true },
  { path: "mis-pedidos", Component: MyOrdersPage, protected: true },
  { path: "reservas", Component: MyReservationsPage, protected: true },
  // Públicas a propósito: probarse una prenda no necesita cuenta.
  { path: "probador", Component: ProbadorPage },
  { path: "probador/:productoId", Component: ProbadorPage },
  { path: "*", Component: NotFoundPage },
]
export { HomePage }

/** Rutas de antes del SaaS → `LegacyRedirect` a `/t/<slug>/...` (links viejos, retornos de Stripe/Wayra). */
export const LEGACY_PATHS = ["/tienda/*", "/sucursales", "/carrito", "/checkout", "/pago/*", "/mis-pedidos", "/reservas", "/probador/*", "/login", "/register"]

// Recursos de negocio: ADMIN exacto (mismos @Roles del backend).
export const ADMIN_ROUTES: { path: string; Component: ComponentType }[] = [
  { path: "catalogo", Component: CatalogoAdminPage },
  { path: "proveedores", Component: ProveedoresAdminPage },
  { path: "sucursales", Component: SucursalesAdminPage },
  { path: "cupones", Component: CuponesAdminPage },
  { path: "usuarios", Component: UsuariosAdminPage },
  { path: "suscripcion", Component: SuscripcionAdminPage },
  { path: "suscripcion/activar", Component: ActivarPlanPage },
  { path: "apariencia", Component: AparienciaAdminPage },
]

// Operación de sucursal: cada ruta habilita los roles que el backend YA exige
// en su controller. Sin `allowedRoles`, StaffRoute cae en su default (reportes).
export const STAFF_ROUTES: { path: string; Component: ComponentType; allowedRoles?: UsuarioRole[] }[] = [
  { path: "dashboard", Component: DashboardAdminPage, allowedRoles: ["ADMIN", "ENCARGADO_SUCURSAL", "CAJERO"] },
  { path: "inventario", Component: InventarioAdminPage, allowedRoles: ["ADMIN", "ENCARGADO_SUCURSAL"] },
  { path: "ventas", Component: VentasAdminPage, allowedRoles: ["ADMIN", "ENCARGADO_SUCURSAL"] },
  { path: "reservas", Component: ReservasAdminPage, allowedRoles: ["ADMIN", "ENCARGADO_SUCURSAL", "CAJERO"] },
  { path: "cobros", Component: CobrosAdminPage, allowedRoles: ["ADMIN", "CAJERO"] },
  { path: "reportes", Component: ReportesAdminPage },
  { path: "ml", Component: MlDashboardPage, allowedRoles: ["ADMIN", "ENCARGADO_SUCURSAL"] },
]

export const ROLES_STAFF: UsuarioRole[] = ["ADMIN", "ENCARGADO_SUCURSAL", "CAJERO"]
