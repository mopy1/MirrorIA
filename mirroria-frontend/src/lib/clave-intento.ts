const RUTAS_DE_DINERO = [
  /^\/ventas\/carrito\/[^/]+\/checkout$/,
  /^\/ventas\/desde-reserva\/[^/]+$/,
  /^\/pagos\//,
  /^\/saas\/mi-suscripcion\/cobro/,
]

export function esOperacionDeDinero(ruta: string): boolean {
  return RUTAS_DE_DINERO.some((r) => r.test(ruta))
}

/**
 * En ventas y cobros la clave identifica el intento, no el clic: el doble clic y
 * el reintento tras una caída mandan la misma, y el servidor no repite la
 * operación. Vive hasta que el servidor da una respuesta definitiva.
 */
export function crearClavesDeIntento(generar: () => string) {
  const vivas = new Map<string, string>()
  const id = (metodo: string, ruta: string, cuerpo: string) => `${metodo} ${ruta} ${cuerpo}`

  return {
    obtener(metodo: string, ruta: string, cuerpo: string): string {
      if (!esOperacionDeDinero(ruta)) return generar()
      const llave = id(metodo, ruta, cuerpo)
      const clave = vivas.get(llave) ?? generar()
      vivas.set(llave, clave)
      return clave
    },
    /** `status` null = se cayó la red. Un 5xx tampoco es definitivo: pudo haberse guardado. */
    terminar(metodo: string, ruta: string, cuerpo: string, status: number | null): void {
      if (status !== null && status < 500) vivas.delete(id(metodo, ruta, cuerpo))
    },
  }
}
