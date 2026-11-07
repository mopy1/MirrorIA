/**
 * Qué guarda el Service Worker. Separado de sw.js para poder probarlo.
 * Solo datos públicos y siempre por tienda: la URL es la misma para todas (la
 * tienda va en la cabecera X-Tenant), así que guardar por URL mezclaba tiendas.
 */
self.swPolitica = (() => {
  const RUTAS_PUBLICAS = [/\/api\/v\d+\/catalogo(\/|$)/, /\/api\/v\d+\/sucursales(\/|$)/]
  const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000

  return {
    esCacheable(url, tienda) {
      if (!tienda) return false
      const { pathname } = new URL(url)
      return RUTAS_PUBLICAS.some((ruta) => ruta.test(pathname))
    },
    claveCache(url, tienda) {
      const clave = new URL(url)
      clave.searchParams.set('__tienda', tienda)
      return clave.href
    },
    sigueVigente(guardadoEn, ahora) {
      return ahora - guardadoEn <= SIETE_DIAS_MS
    },
  }
})()
