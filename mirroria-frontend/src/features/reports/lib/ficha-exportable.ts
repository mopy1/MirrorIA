import type { Ficha, Reporte } from "../types/reports.types"
import { dimensionDelReporte, metricaDelReporte } from "./report-metricas"

/** Argumentos de `consultar_metricas` que el backend copia a los filtros (ver `ia-agente.service.ts`). */
const FILTROS_DEL_AGENTE: Record<string, string> = {
  fechaInicio: "desde",
  fechaFin: "hasta",
  sucursalId: "sucursalId",
  categoriaId: "categoriaId",
  canal: "canal",
}

/**
 * Ficha válida para exportar. El backend vuelve a calcular las filas con ella y la valida
 * contra el catálogo, así que el "hibrido" que arma `mapHibridoAReporte` daba 400: se rearma
 * con la última consulta del agente. Una simulación no tiene ficha del motor → null.
 */
export function fichaExportable(reporte: Reporte): Ficha | null {
  if (reporte.esSimulacion) return null
  const metrica = metricaDelReporte(reporte)
  const agruparPor = dimensionDelReporte(reporte)
  if (!metrica || !agruparPor) return null
  if (metrica === reporte.ficha.metrica && agruparPor === reporte.ficha.agruparPor) return reporte.ficha

  const consulta = [...(reporte.pasosEjecutados ?? [])].reverse().find((p) => p.herramienta === "consultar_metricas")
  const args = consulta?.argumentos ?? {}
  const filtros: Record<string, string> = {}
  for (const [arg, filtro] of Object.entries(FILTROS_DEL_AGENTE)) {
    if (args[arg]) filtros[filtro] = String(args[arg])
  }
  return {
    metrica,
    agruparPor,
    filtros,
    orden: args.orden === "asc" ? "asc" : "desc",
    limite: Math.min(100, Math.max(1, Number(args.limite) || 10)),
  }
}
