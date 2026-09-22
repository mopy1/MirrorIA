import type { ComponentType, ReactNode } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { CatalogoAdminPage } from "@/features/admin/pages/CatalogoAdminPage"
import { CobrosAdminPage } from "@/features/admin/pages/CobrosAdminPage"
import { CuponesAdminPage } from "@/features/admin/pages/CuponesAdminPage"
import { InventarioAdminPage } from "@/features/admin/pages/InventarioAdminPage"
import { ProveedoresAdminPage } from "@/features/admin/pages/ProveedoresAdminPage"
import { ReportesAdminPage } from "@/features/admin/pages/ReportesAdminPage"
import { ReservasAdminPage } from "@/features/admin/pages/ReservasAdminPage"
import { SucursalesAdminPage } from "@/features/admin/pages/SucursalesAdminPage"
import { UsuariosAdminPage } from "@/features/admin/pages/UsuariosAdminPage"
import { VentasAdminPage } from "@/features/admin/pages/VentasAdminPage"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { RegisterPage } from "@/features/auth/pages/RegisterPage"
import { BranchesPage } from "@/features/branches/pages/BranchesPage"
import { HomePage } from "@/features/catalog/pages/HomePage"
import { ProductDetailPage } from "@/features/catalog/pages/ProductDetailPage"
import { ProductListPage } from "@/features/catalog/pages/ProductListPage"
import { CartPage } from "@/features/cart/pages/CartPage"
import { CheckoutPage } from "@/features/checkout/pages/CheckoutPage"
import { OrderConfirmationPage } from "@/features/checkout/pages/OrderConfirmationPage"
import { PagoPage } from "@/features/payments/pages/PagoPage"
import { MyReservationsPage } from "@/features/reservations/pages/MyReservationsPage"
import { AdminLayout } from "@/layouts/AdminLayout"
import { StorefrontLayout } from "@/layouts/StorefrontLayout"
import { AdminRoute } from "@/routes/AdminRoute"
import { GuestRoute } from "@/routes/GuestRoute"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { StaffRoute } from "@/routes/StaffRoute"

// Composición repetida por las 8 rutas /admin/* de recursos simples — evita
// repetir AdminRoute+AdminLayout en cada una.
function AdminPage({ children }: { children: ReactNode }) {
  return (
    <AdminRoute>
      <AdminLayout>{children}</AdminLayout>
    </AdminRoute>
  )
}

// Rutas de la tienda: mismo StorefrontLayout siempre, algunas piden sesión
// (`protected`). Data-driven (Regla 1.B.3) porque son puro path+componente
// repetido — la única variación real es esa bandera.
const STOREFRONT_ROUTES: { path: string; Component: ComponentType; protected?: boolean }[] = [
  { path: "/", Component: HomePage },
  { path: "/tienda", Component: ProductListPage },
  { path: "/tienda/producto/:id", Component: ProductDetailPage },
  { path: "/sucursales", Component: BranchesPage },
  { path: "/carrito", Component: CartPage, protected: true },
  { path: "/checkout", Component: CheckoutPage, protected: true },
  { path: "/checkout/:id/confirmacion", Component: OrderConfirmationPage, protected: true },
  // Las 3 rutas de pago renderizan la misma página — PagoPage decide qué
  // mostrar mirando el pathname actual.
  { path: "/pago/:ventaId", Component: PagoPage, protected: true },
  { path: "/pago/exito", Component: PagoPage, protected: true },
  { path: "/pago/cancelado", Component: PagoPage, protected: true },
  { path: "/reservas", Component: MyReservationsPage, protected: true },
]

// Recursos "planos" del panel admin: mismo AdminPage siempre. `cobros` y
// `reportes` quedan afuera de esta tabla porque usan StaffRoute (rol
// CAJERO/staff), no AdminRoute (solo ADMIN).
const ADMIN_ROUTES: { path: string; Component: ComponentType }[] = [
  { path: "/admin/catalogo", Component: CatalogoAdminPage },
  { path: "/admin/proveedores", Component: ProveedoresAdminPage },
  { path: "/admin/sucursales", Component: SucursalesAdminPage },
  { path: "/admin/inventario", Component: InventarioAdminPage },
  { path: "/admin/ventas", Component: VentasAdminPage },
  { path: "/admin/reservas", Component: ReservasAdminPage },
  { path: "/admin/cupones", Component: CuponesAdminPage },
  { path: "/admin/usuarios", Component: UsuariosAdminPage },
]

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {STOREFRONT_ROUTES.map(({ path, Component, protected: needsAuth }) => (
          <Route
            key={path}
            path={path}
            element={
              <StorefrontLayout>
                {needsAuth ? (
                  <ProtectedRoute>
                    <Component />
                  </ProtectedRoute>
                ) : (
                  <Component />
                )}
              </StorefrontLayout>
            }
          />
        ))}

        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />

        <Route path="/admin" element={<Navigate to="/admin/catalogo" replace />} />
        {ADMIN_ROUTES.map(({ path, Component }) => (
          <Route
            key={path}
            path={path}
            element={
              <AdminPage>
                <Component />
              </AdminPage>
            }
          />
        ))}
        <Route
          path="/admin/cobros"
          element={
            <StaffRoute allowedRoles={["ADMIN", "CAJERO"]}>
              <AdminLayout>
                <CobrosAdminPage />
              </AdminLayout>
            </StaffRoute>
          }
        />
        <Route
          path="/admin/reportes"
          element={
            <StaffRoute>
              <AdminLayout>
                <ReportesAdminPage />
              </AdminLayout>
            </StaffRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
