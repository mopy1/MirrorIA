export interface OpcionSelector {
  id: string
  label: string
}

export const METRICAS_DISPONIBLES: OpcionSelector[] = [
  // Neto de descuentos en el total; por prenda o categoría suma el precio de cada línea.
  { id: "ingresos", label: "Ingresos (Bs)" },
  { id: "unidades", label: "Unidades Vendidas" },
  { id: "cantidad_ventas", label: "Cantidad de Ventas" },
  { id: "ticket_promedio", label: "Ticket Promedio (Bs)" },
  { id: "descuentos", label: "Descuentos Aplicados (Bs)" },
  { id: "stock_disponible", label: "Stock Disponible" },
  { id: "stock_reservado", label: "Stock Reservado" },
  { id: "cantidad_reservas", label: "Cantidad de Reservas" },
  { id: "descuento_por_cupon", label: "Canjes de Cupón (Bs)" },
]

export const DIMENSIONES_DISPONIBLES: OpcionSelector[] = [
  { id: "categoria", label: "Categoría" },
  { id: "producto", label: "Producto" },
  { id: "sucursal", label: "Sucursal" },
  { id: "canal", label: "Canal (Web / Presencial)" },
  { id: "metodo_pago", label: "Método de Pago (QR, Tarjeta, Efectivo)" },
  { id: "proveedor_pago", label: "Pasarela / Proveedor de Pago" },
  { id: "proveedor", label: "Proveedor de Colección" },
  { id: "mes", label: "Mes" },
  { id: "dia", label: "Día" },
]

export const RANGOS_PRESET: OpcionSelector[] = [
  { id: "hoy", label: "Hoy" },
  { id: "ultimos_7", label: "Últimos 7 días" },
  { id: "ultimos_30", label: "Últimos 30 días" },
  { id: "este_mes", label: "Este mes" },
  { id: "mes_anterior", label: "Mes anterior" },
  { id: "historico", label: "Histórico completo" },
]

export function resolverRango(preset: string): { desde?: string; hasta?: string } {
  const hoy = new Date().toISOString().slice(0, 10)
  if (preset === "hoy") return { desde: hoy, hasta: hoy }
  if (preset === "ultimos_7") {
    const d = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    return { desde: d, hasta: hoy }
  }
  if (preset === "ultimos_30") {
    const d = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
    return { desde: d, hasta: hoy }
  }
  if (preset === "este_mes") {
    const d = new Date()
    const desde = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
    return { desde, hasta: hoy }
  }
  if (preset === "mes_anterior") {
    const d = new Date()
    const anio = d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear()
    const mes = d.getMonth() === 0 ? 12 : d.getMonth()
    const mesStr = String(mes).padStart(2, "0")
    const ultimoDia = new Date(anio, mes, 0).getDate()
    return {
      desde: `${anio}-${mesStr}-01`,
      hasta: `${anio}-${mesStr}-${String(ultimoDia).padStart(2, "0")}`,
    }
  }
  return { desde: undefined, hasta: undefined }
}

export function calcularPeriodoAnterior(desde?: string, hasta?: string): { desde: string; hasta: string } | undefined {
  if (!desde || !hasta) return undefined
  const diffMs = new Date(hasta).getTime() - new Date(desde).getTime()
  const antHasta = new Date(new Date(desde).getTime() - 86400000).toISOString().slice(0, 10)
  const antDesde = new Date(new Date(antHasta).getTime() - diffMs).toISOString().slice(0, 10)
  return { desde: antDesde, hasta: antHasta }
}
