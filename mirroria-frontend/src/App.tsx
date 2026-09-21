import type { ReactNode } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { CatalogoAdminPage } from "@/features/admin/pages/CatalogoAdminPage"
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
import { MyReservationsPage } from "@/features/reservations/pages/MyReservationsPage"
import { AdminLayout } from "@/layouts/AdminLayout"
import { StorefrontLayout } from "@/layouts/StorefrontLayout"
import { AdminRoute } from "@/routes/AdminRoute"
import { GuestRoute } from "@/routes/GuestRoute"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { StaffRoute } from "@/routes/StaffRoute"

// Composición repetida por las 5 rutas /admin/* — evita repetir
// AdminRoute+AdminLayout en cada <Route> de abajo.
function AdminPage({ children }: { children: ReactNode }) {
  return (
    <AdminRoute>
      <AdminLayout>{children}</AdminLayout>
    </AdminRoute>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <StorefrontLayout>
              <HomePage />
            </StorefrontLayout>
          }
        />
        <Route
          path="/tienda"
          element={
            <StorefrontLayout>
              <ProductListPage />
            </StorefrontLayout>
          }
        />
        <Route
          path="/tienda/producto/:id"
          element={
            <StorefrontLayout>
              <ProductDetailPage />
            </StorefrontLayout>
          }
        />
        <Route
          path="/sucursales"
          element={
            <StorefrontLayout>
              <BranchesPage />
            </StorefrontLayout>
          }
        />
        <Route
          path="/carrito"
          element={
            <StorefrontLayout>
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            </StorefrontLayout>
          }
        />
        <Route
          path="/checkout"
          element={
            <StorefrontLayout>
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            </StorefrontLayout>
          }
        />
        <Route
          path="/checkout/:id/confirmacion"
          element={
            <StorefrontLayout>
              <ProtectedRoute>
                <OrderConfirmationPage />
              </ProtectedRoute>
            </StorefrontLayout>
          }
        />
        <Route
          path="/reservas"
          element={
            <StorefrontLayout>
              <ProtectedRoute>
                <MyReservationsPage />
              </ProtectedRoute>
            </StorefrontLayout>
          }
        />
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
        <Route
          path="/admin/catalogo"
          element={
            <AdminPage>
              <CatalogoAdminPage />
            </AdminPage>
          }
        />
        <Route
          path="/admin/proveedores"
          element={
            <AdminPage>
              <ProveedoresAdminPage />
            </AdminPage>
          }
        />
        <Route
          path="/admin/sucursales"
          element={
            <AdminPage>
              <SucursalesAdminPage />
            </AdminPage>
          }
        />
        <Route
          path="/admin/inventario"
          element={
            <AdminPage>
              <InventarioAdminPage />
            </AdminPage>
          }
        />
        <Route
          path="/admin/ventas"
          element={
            <AdminPage>
              <VentasAdminPage />
            </AdminPage>
          }
        />
        <Route
          path="/admin/reservas"
          element={
            <AdminPage>
              <ReservasAdminPage />
            </AdminPage>
          }
        />
        <Route
          path="/admin/cupones"
          element={
            <AdminPage>
              <CuponesAdminPage />
            </AdminPage>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <AdminPage>
              <UsuariosAdminPage />
            </AdminPage>
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
