const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Nombre legible de una prenda. Prioridad: nombre del catálogo → nombre que vino en la predicción →
 * id semilla humanizado ('prod_vestido_seda_01' → 'Vestido Seda'). Un UUID nunca se muestra.
 */
export function formatearNombrePrenda(id: string, nombre?: string): string {
  if (nombre && !nombre.startsWith("prod_")) return nombre
  if (UUID.test(id)) return "Prenda sin nombre"
  const limpio = id.replace(/^prod_/, "").replace(/_\d+$/, "").replace(/_/g, " ").trim()
  if (!limpio) return "Prenda sin nombre"
  return limpio
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

/** 'vta_pos_reg_101' → 'Venta #101'. Si el id es interno (UUID), no hay número que mostrar: null. */
export function formatearNombreVenta(ventaId: string): string | null {
  if (UUID.test(ventaId)) return null
  const match = ventaId.match(/(\d+)$/)
  return match ? `Venta #${match[1]}` : null
}
