import { useCallback, useEffect, useState } from "react"
import { reportsApi } from "../api/reportsApi"
import type { Dato, DatosCifras } from "../lib/inicio-cifras"
import { FICHAS_CIFRAS, GRAFICOS_INICIALES, type GraficoInicial } from "../reportes-iniciales.data"
import type { Ficha } from "../types/reports.types"

const PEDIDOS: [string, Partial<Ficha>][] = [
  ...Object.entries(FICHAS_CIFRAS),
  ...GRAFICOS_INICIALES.map((g): [string, Partial<Ficha>] => [g.id, g.ficha]),
]

/** Pide las cifras y los gráficos del inicio en paralelo. Cada dato guarda su propio
 * estado (`undefined` cargando, `null` falló): si uno falla, los demás igual se ven,
 * y `recargar(id)` reintenta solo ese. */
export function useReportesIniciales() {
  const [datos, setDatos] = useState<Record<string, Dato>>({})

  const pedir = useCallback((id: string, ficha: Partial<Ficha>, vivo: () => boolean = () => true) => {
    setDatos((prev) => ({ ...prev, [id]: undefined }))
    reportsApi
      .consultar(ficha)
      .then((reporte) => vivo() && setDatos((prev) => ({ ...prev, [id]: reporte })))
      .catch(() => vivo() && setDatos((prev) => ({ ...prev, [id]: null })))
  }, [])

  useEffect(() => {
    let activo = true
    PEDIDOS.forEach(([id, ficha]) => pedir(id, ficha, () => activo))
    return () => {
      activo = false
    }
  }, [pedir])

  const cifras: DatosCifras = {
    ingresos: datos.ingresos,
    ventas: datos.ventas,
    reservas: datos.reservas,
    productos: datos.productos,
    categorias: datos.categorias,
  }
  const graficos: { def: GraficoInicial; dato: Dato }[] = GRAFICOS_INICIALES.map((def) => ({ def, dato: datos[def.id] }))

  function recargar(id: string) {
    const pedido = PEDIDOS.find(([k]) => k === id)
    if (pedido) pedir(pedido[0], pedido[1])
  }

  return { cifras, graficos, recargar }
}
