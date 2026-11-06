import type { DatosCifras } from "./lib/inicio-cifras"
import type { Ficha } from "./types/reports.types"

/** Reportes que se cargan solos al entrar a /admin/reportes, sin pasar por el modelo
 * de IA: van directo a `POST /ia/reportes/consulta` (ficha armada a mano — ver
 * `mirroria-backend/AGENTS.md`, sección `ia`) para que la pantalla no arranque vacía.
 * Sin `desde`/`hasta`: el motor suma todo lo registrado hasta hoy. */
export const FICHAS_CIFRAS: Record<keyof DatosCifras, Partial<Ficha>> = {
  ingresos: { metrica: "ingresos", agruparPor: "ninguno" },
  ventas: { metrica: "cantidad_ventas", agruparPor: "ninguno" },
  // Por estado, para decir cuántas terminaron en compra y cuántas no.
  reservas: { metrica: "cantidad_reservas", agruparPor: "estado" },
  productos: { metrica: "cantidad_productos", agruparPor: "ninguno" },
  categorias: { metrica: "cantidad_categorias", agruparPor: "ninguno" },
}

export interface GraficoInicial {
  id: string
  titulo: string
  ficha: Partial<Ficha>
  /** Pregunta que se le manda a la IA desde "Analizar con IA". */
  pregunta: string
  esMoneda: boolean
  /** Vacío que enseña: qué falta para que aparezca el gráfico. */
  textoVacio: string
  /** Una sola fila (no hay nada que comparar): la frase que la reemplaza. */
  textoUnico: (etiqueta: string, valor: string) => string
}

export const GRAFICOS_INICIALES: GraficoInicial[] = [
  {
    id: "ingresos-sucursal",
    titulo: "Ingresos por sucursal",
    ficha: { metrica: "ingresos", agruparPor: "sucursal" },
    pregunta: "¿Cuánto vendí este mes por sucursal?",
    esMoneda: true,
    textoVacio: "Todavía no hay ventas pagadas en tus sucursales. Cuando cobres la primera, acá vas a ver cuál rinde más.",
    textoUnico: (etiqueta, valor) =>
      `Todo lo vendido salió de ${etiqueta}: ${valor}. Cuando vendas desde otra sucursal, acá vas a poder compararlas.`,
  },
  {
    id: "top-productos",
    titulo: "Prendas más vendidas",
    ficha: { metrica: "unidades", agruparPor: "producto", orden: "desc", limite: 5 },
    pregunta: "Top 5 productos más vendidos",
    esMoneda: false,
    textoVacio: "Todavía no vendiste prendas. Con la primera venta pagada vas a ver acá cuáles salen más.",
    textoUnico: (etiqueta, valor) =>
      `Por ahora solo se vendió ${etiqueta} (${valor} ${valor === "1" ? "unidad" : "unidades"}). Con más ventas vas a ver el ranking.`,
  },
]
