import { Suspense } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { PageFallback } from "@/components/common/PageFallback"
import { ModalConflictoStock } from "@/components/common/modal-conflicto-stock"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { RegisterPage } from "@/features/auth/pages/RegisterPage"
import { NotFoundPage } from "@/features/errors/pages/NotFoundPage"
import { EntrarPage } from "@/features/saas/pages/EntrarPage"
import { LandingPage } from "@/features/saas/pages/LandingPage"
import { AdminLayout } from "@/layouts/AdminLayout"
import { PlataformaLayout } from "@/layouts/PlataformaLayout"
import { SaasLayout } from "@/layouts/SaasLayout"
import { TiendaLayout, TiendaRoot } from "@/layouts/TiendaLayout"
import { AdminRoute } from "@/routes/AdminRoute"
import { GuestRoute } from "@/routes/GuestRoute"
import { LegacyRedirect } from "@/routes/LegacyRedirect"
import {
  PlanesPage, PlataformaCiudadesPage, PlataformaDashboardPage, PlataformaInquilinoDetallePage, PlataformaInquilinosPage, PlataformaLoginPage, PlataformaPlanesPage,
  RegistroTiendaPage, WayraPagoPage,
} from "@/routes/lazy-pages"
import { PlataformaRoute } from "@/routes/PlataformaRoute"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { ADMIN_ROUTES, HomePage, LEGACY_PATHS, ROLES_STAFF, STAFF_ROUTES, TIENDA_ROUTES } from "@/routes/rutas-app"
import { StaffRoute } from "@/routes/StaffRoute"

/**
 * Mapa de rutas (spec Fase 1 §7.1): `/` landing SaaS · `/t/:slug/*` tienda ·
 * `/admin/*` panel de la tienda del JWT · `/plataforma/*` DUENO_PLATAFORMA ·
 * rutas viejas → `/t/<slug>/...`. Las tablas de rutas viven en `routes/rutas-app.ts`.
 */
function App() {
  return (
    <BrowserRouter>
      <ModalConflictoStock />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<SaasLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="planes" element={<PlanesPage />} />
            <Route path="registro-tienda" element={<GuestRoute><RegistroTiendaPage /></GuestRoute>} />
            <Route path="entrar" element={<EntrarPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="/t/:slug" element={<TiendaRoot />}>
            <Route element={<TiendaLayout />}>
              <Route index element={<HomePage />} />
              {TIENDA_ROUTES.map(({ path, Component, protected: needsAuth }) => (
                <Route key={path} path={path} element={needsAuth ? <ProtectedRoute><Component /></ProtectedRoute> : <Component />} />
              ))}
            </Route>
            <Route path="login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="registro" element={<GuestRoute><RegisterPage /></GuestRoute>} />
          </Route>

          {LEGACY_PATHS.map((path) => (
            <Route key={path} path={path} element={<LegacyRedirect />} />
          ))}

          {/* La app del banco (Wayra): pública, global y sin layout de tienda (es OTRA app). */}
          <Route path="/wayra/pagar/:token" element={<WayraPagoPage />} />

          <Route path="/admin" element={<StaffRoute allowedRoles={ROLES_STAFF}><AdminLayout /></StaffRoute>}>
            <Route index element={<Navigate to="/admin/catalogo" replace />} />
            {ADMIN_ROUTES.map(({ path, Component }) => (
              <Route key={path} path={path} element={<AdminRoute><Component /></AdminRoute>} />
            ))}
            {STAFF_ROUTES.map(({ path, Component, allowedRoles }) => (
              <Route key={path} path={path} element={<StaffRoute allowedRoles={allowedRoles}><Component /></StaffRoute>} />
            ))}
          </Route>

          <Route path="/plataforma/login" element={<GuestRoute><PlataformaLoginPage /></GuestRoute>} />
          <Route path="/plataforma" element={<PlataformaRoute><PlataformaLayout /></PlataformaRoute>}>
            <Route index element={<Navigate to="/plataforma/resumen" replace />} />
            <Route path="resumen" element={<PlataformaDashboardPage />} />
            <Route path="inquilinos" element={<PlataformaInquilinosPage />} />
            <Route path="inquilinos/:id" element={<PlataformaInquilinoDetallePage />} />
            <Route path="planes" element={<PlataformaPlanesPage />} />
            <Route path="ciudades" element={<PlataformaCiudadesPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
