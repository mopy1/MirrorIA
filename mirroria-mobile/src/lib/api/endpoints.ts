/** Rutas del backend (base /api/v1) usadas por la app. 🧭 = plataforma (sin X-Tenant). */
export const EP = {
  tiendas: '/saas/tiendas?limite=50', // 🧭
  tienda: (slug: string) => `/saas/tiendas/${encodeURIComponent(slug)}`, // 🧭
  login: '/seguridad/auth/login',
  registro: '/seguridad/auth/register',
  me: '/seguridad/auth/me',
  sucursales: '/sucursales',
  productosConVariantes: '/catalogo/productos?conVariantes=true',
  categorias: '/catalogo/categorias',
  tallas: '/catalogo/tallas',
  inventario: '/inventario',
  carrito: (usuarioId: string) => `/ventas/carrito/${usuarioId}`,
} as const;
