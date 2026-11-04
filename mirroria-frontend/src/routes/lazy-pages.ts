import { lazy, type ComponentType } from "react"

// Páginas que la clienta de la tienda casi nunca abre: el panel /admin/*, el
// probador (arrastra @decartai/sdk + livekit) y la "app del banco" Wayra. Van
// en chunks aparte para que el bundle inicial de la tienda pública no las
// cargue. Las páginas exportan con nombre, así que se adaptan a `default`.
function diferida<M, K extends keyof M>(cargar: () => Promise<M>, nombre: K) {
  return lazy(async () => ({ default: (await cargar())[nombre] as ComponentType }))
}

export const CatalogoAdminPage = diferida(() => import("@/features/admin/pages/CatalogoAdminPage"), "CatalogoAdminPage")
export const CobrosAdminPage = diferida(() => import("@/features/admin/pages/CobrosAdminPage"), "CobrosAdminPage")
export const CuponesAdminPage = diferida(() => import("@/features/admin/pages/CuponesAdminPage"), "CuponesAdminPage")
export const InventarioAdminPage = diferida(
  () => import("@/features/admin/pages/InventarioAdminPage"),
  "InventarioAdminPage",
)
export const ProveedoresAdminPage = diferida(
  () => import("@/features/admin/pages/ProveedoresAdminPage"),
  "ProveedoresAdminPage",
)
export const ReportesAdminPage = diferida(() => import("@/features/admin/pages/ReportesAdminPage"), "ReportesAdminPage")
export const ReservasAdminPage = diferida(() => import("@/features/admin/pages/ReservasAdminPage"), "ReservasAdminPage")
export const SucursalesAdminPage = diferida(
  () => import("@/features/admin/pages/SucursalesAdminPage"),
  "SucursalesAdminPage",
)
export const UsuariosAdminPage = diferida(() => import("@/features/admin/pages/UsuariosAdminPage"), "UsuariosAdminPage")
export const VentasAdminPage = diferida(() => import("@/features/admin/pages/VentasAdminPage"), "VentasAdminPage")
export const ProbadorPage = diferida(() => import("@/features/fitting/pages/ProbadorPage"), "ProbadorPage")
export const WayraPagoPage = diferida(() => import("@/features/wayra/pages/WayraPagoPage"), "WayraPagoPage")
