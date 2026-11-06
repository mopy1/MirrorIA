import type { Reporte } from "../types/reports.types"

/**
 * Vocabulario humano de las métricas y dimensiones del catálogo del backend
 * (`mirroria-backend/src/modules/ia/service/catalogo-metricas.ts`). Se mantiene
 * a mano: si el backend agrega una métrica, sumarla acá o el lienzo la nombra
 * genérico ("el valor") y oculta el selector "Ver por".
 */
interface InfoMetrica {
  /** Con artículo, para frases: "las unidades vendidas". */
  nombre: string
  /** Sumar filas tiene sentido (no lo tiene para promedios ni clientas únicas). */
  aditiva: boolean
  /** Dimensiones por las que el backend acepta reagrupar esta métrica. */
  dimensiones: readonly string[]
}

const DIMS_VENTAS = ["sucursal", "canal", "estado", "dia", "mes", "categoria", "producto", "cliente", "metodo_pago", "proveedor_pago"] as const
const DIMS_CABECERA = DIMS_VENTAS.filter((d) => d !== "categoria" && d !== "producto")
const DIMS_INVENTARIO = ["sucursal", "categoria", "producto"] as const
const DIMS_KARDEX = ["sucursal", "tipo_movimiento", "producto", "categoria", "dia", "mes"] as const
const DIMS_RESERVAS = ["estado", "sucursal", "dia", "mes"] as const
const DIMS_CUPONES = ["cupon", "sucursal", "mes"] as const
const DIMS_COMPRAS = ["estado", "proveedor", "sucursal", "mes"] as const

const METRICAS: Record<string, InfoMetrica> = {
  ingresos: { nombre: "los ingresos", aditiva: true, dimensiones: [...DIMS_VENTAS, "proveedor"] },
  unidades: { nombre: "las unidades vendidas", aditiva: true, dimensiones: [...DIMS_VENTAS, "proveedor"] },
  cantidad_ventas: { nombre: "la cantidad de ventas", aditiva: true, dimensiones: DIMS_VENTAS },
  ticket_promedio: { nombre: "el gasto promedio por compra", aditiva: false, dimensiones: DIMS_CABECERA },
  descuentos: { nombre: "los descuentos", aditiva: true, dimensiones: DIMS_CABECERA },
  clientes_activos: { nombre: "las clientas que compraron", aditiva: false, dimensiones: DIMS_VENTAS },
  stock_disponible: { nombre: "el stock disponible", aditiva: true, dimensiones: DIMS_INVENTARIO },
  stock_reservado: { nombre: "el stock reservado", aditiva: true, dimensiones: DIMS_INVENTARIO },
  stock_en_transito: { nombre: "el stock en camino", aditiva: true, dimensiones: DIMS_INVENTARIO },
  movimientos_unidades: { nombre: "las unidades movidas en inventario", aditiva: true, dimensiones: DIMS_KARDEX },
  movimientos_conteo: { nombre: "los movimientos de inventario", aditiva: true, dimensiones: DIMS_KARDEX },
  cantidad_reservas: { nombre: "las reservas", aditiva: true, dimensiones: DIMS_RESERVAS },
  unidades_reservadas: { nombre: "las prendas reservadas", aditiva: true, dimensiones: DIMS_RESERVAS },
  canjes_cupon: { nombre: "los cupones usados", aditiva: true, dimensiones: DIMS_CUPONES },
  descuento_por_cupon: { nombre: "el descuento por cupones", aditiva: true, dimensiones: DIMS_CUPONES },
  cantidad_ordenes: { nombre: "las órdenes de compra", aditiva: true, dimensiones: DIMS_COMPRAS },
  unidades_pedidas: { nombre: "las unidades pedidas a proveedores", aditiva: true, dimensiones: DIMS_COMPRAS },
  unidades_recibidas: { nombre: "las unidades recibidas de proveedores", aditiva: true, dimensiones: DIMS_COMPRAS },
  stock_proveedores: { nombre: "las unidades pendientes de proveedores", aditiva: true, dimensiones: [] },
  cantidad_usuarios: { nombre: "las personas del equipo", aditiva: true, dimensiones: ["rol"] },
  cantidad_productos: { nombre: "las prendas del catálogo", aditiva: true, dimensiones: ["categoria"] },
}

/** [singular, plural] de cada dimensión, en minúscula. */
const DIMENSIONES: Record<string, [string, string]> = {
  sucursal: ["sucursal", "sucursales"],
  categoria: ["categoría", "categorías"],
  producto: ["prenda", "prendas"],
  canal: ["canal de venta", "canales de venta"],
  estado: ["estado", "estados"],
  cliente: ["clienta", "clientas"],
  metodo_pago: ["forma de pago", "formas de pago"],
  proveedor_pago: ["pasarela de pago", "pasarelas de pago"],
  proveedor: ["proveedor", "proveedores"],
  tipo_movimiento: ["tipo de movimiento", "tipos de movimiento"],
  cupon: ["cupón", "cupones"],
  rol: ["rol", "roles"],
  dia: ["día", "días"],
  mes: ["mes", "meses"],
}

export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** Métrica real del reporte; en una simulación, la que se consultó antes de proyectar. */
export function metricaDelReporte(reporte: Reporte): string | null {
  const { metrica } = reporte.ficha
  if (METRICAS[metrica]) return metrica
  const consulta = [...(reporte.pasosEjecutados ?? [])].reverse().find((p) => p.herramienta === "consultar_metricas")
  const desdePaso = consulta?.argumentos.metrica
  if (typeof desdePaso !== "string") return null
  return desdePaso === "ventas_totales" ? "ingresos" : desdePaso
}

/** Dimensión real: `ficha.agruparPor`, o la que usó el agente IA (el híbrido trae "hibrido"). */
export function dimensionDelReporte(reporte: Reporte): string | null {
  const { agruparPor } = reporte.ficha
  if (DIMENSIONES[agruparPor] || agruparPor === "ninguno") return agruparPor
  const consulta = [...(reporte.pasosEjecutados ?? [])].reverse().find((p) => p.herramienta === "consultar_metricas")
  const dim = consulta?.argumentos.dimension
  return typeof dim === "string" && (DIMENSIONES[dim] || dim === "ninguno") ? dim : null
}

export function nombreMetrica(metrica: string | null): string {
  return (metrica && METRICAS[metrica]?.nombre) || "el valor"
}

export function esMetricaAditiva(metrica: string | null): boolean {
  return metrica ? (METRICAS[metrica]?.aditiva ?? true) : true
}

export function nombreDimension(dimension: string | null, plural = false): string | null {
  const par = dimension ? DIMENSIONES[dimension] : undefined
  return par ? par[plural ? 1 : 0] : null
}

/** Opciones del selector "Ver por": solo dimensiones que el backend acepta para esa métrica. */
export function opcionesPivote(metrica: string | null): { id: string; etiqueta: string }[] {
  const dims = metrica ? (METRICAS[metrica]?.dimensiones ?? []) : []
  return dims.map((id) => ({ id, etiqueta: capitalizar(DIMENSIONES[id][0]) }))
}

export function esSerieTemporal(dimension: string | null): boolean {
  return dimension === "dia" || dimension === "mes"
}
