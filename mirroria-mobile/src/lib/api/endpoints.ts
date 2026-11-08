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
  validarCupon: '/promociones/cupones/validar',
  cupoReservas: '/reservas/mias/cupo',
  misReservas: '/reservas/mias',
  reserva: (id: string) => `/reservas/${id}`,
  cancelarReserva: (id: string) => `/reservas/${id}/cancelar`,
  comprarReserva: (id: string) => `/ventas/desde-reserva/${id}`,
  misVentas: '/ventas/mias',
  venta: (id: string) => `/ventas/${id}`,
  pasarelas: '/pagos/pasarelas?contexto=checkout',
  pagoQr: (ventaId: string) => `/pagos/ventas/${ventaId}/qr`,
  estadoQr: (pagoId: string) => `/pagos/qr/${pagoId}`,
  pagoTarjeta: (ventaId: string) => `/pagos/ventas/${ventaId}/sesion`,
  pagoEfectivo: (ventaId: string) => `/pagos/ventas/${ventaId}/manual`,
  cancelarVenta: (ventaId: string) => `/pagos/ventas/${ventaId}/cancelar`,
  tokenProbador: '/probador/token', // 🧭 público, sin X-Tenant (token efímero de Decart)
} as const;
