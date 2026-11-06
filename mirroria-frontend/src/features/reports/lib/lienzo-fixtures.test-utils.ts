import type { PasoEjecutado } from "../types/reports-hybrid.types"
import type { FilaReporte, Reporte } from "../types/reports.types"

/** Reporte de prueba con la forma real que arma `mapHibridoAReporte`. */
export function reporteDePrueba(parcial: Partial<Reporte> & { filas?: FilaReporte[]; metrica?: string; agruparPor?: string } = {}): Reporte {
  const { metrica = "unidades", agruparPor = "producto", ...resto } = parcial
  return {
    ficha: { metrica, agruparPor, filtros: {}, orden: "desc", limite: 5 },
    filas: [],
    comparacion: null,
    narrativa: null,
    ...resto,
  }
}

export const TOP5: FilaReporte[] = [
  { clave: "0", etiqueta: "Vestido Floral Primavera", valor: 10 },
  { clave: "1", etiqueta: "Vestido Noche Negro", valor: 8 },
  { clave: "2", etiqueta: "Blusa Seda Blanca", valor: 6 },
  { clave: "3", etiqueta: "Pantalón Palazzo Negro", valor: 5 },
  { clave: "4", etiqueta: "Bufanda Estampada", valor: 4 },
]

export function pasoConsulta(argumentos: Record<string, unknown>, resumen = "Metrica unidades obtenida: 5 filas."): PasoEjecutado {
  return { paso: 1, herramienta: "consultar_metricas", argumentos, resultadoResumen: resumen }
}
