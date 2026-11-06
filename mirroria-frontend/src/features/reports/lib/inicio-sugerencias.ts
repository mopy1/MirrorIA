/**
 * Preguntas de ejemplo para el inicio de Reportes y el chat vacío. Todas están
 * respaldadas por una métrica real del catálogo del backend (`ia/catalogo-metricas`):
 * clicarlas siempre da un reporte, nunca una aclaración.
 */

export type TemaSugerencia = "ventas" | "productos" | "reservas" | "personas"

export interface Sugerencia {
  tema: TemaSugerencia
  texto: string
}

export const TEMAS: { id: TemaSugerencia; nombre: string }[] = [
  { id: "ventas", nombre: "Ventas" },
  { id: "productos", nombre: "Productos" },
  { id: "reservas", nombre: "Reservas" },
  { id: "personas", nombre: "Clientas y proveedores" },
]

export const SUGERENCIAS: Sugerencia[] = [
  { tema: "ventas", texto: "¿Cuánto vendí este mes por sucursal?" },
  { tema: "ventas", texto: "¿Cómo me pagan mis clientas: efectivo, tarjeta o QR?" },
  { tema: "ventas", texto: "Ingresos por día de los últimos 30 días" },
  { tema: "productos", texto: "Top 5 productos más vendidos" },
  { tema: "productos", texto: "¿Qué categoría me deja más ingresos?" },
  { tema: "productos", texto: "¿Cuánto stock disponible tengo por sucursal?" },
  { tema: "reservas", texto: "¿Cuántas reservas se cancelaron este mes?" },
  { tema: "reservas", texto: "Reservas por estado" },
  { tema: "reservas", texto: "¿Qué prendas se reservan más?" },
  { tema: "personas", texto: "¿Quiénes son las 5 clientas que más compran?" },
  { tema: "personas", texto: "Unidades pedidas por proveedor este mes" },
  { tema: "personas", texto: "¿Cuántas órdenes de compra hay por estado?" },
]

export interface GrupoSugerencias {
  tema: TemaSugerencia
  nombre: string
  preguntas: string[]
}

/** Agrupa en el orden de `TEMAS`, sin grupos vacíos y sin repetir preguntas. */
export function agruparPorTema(sugerencias: Sugerencia[] = SUGERENCIAS): GrupoSugerencias[] {
  return TEMAS.map(({ id, nombre }) => ({
    tema: id,
    nombre,
    preguntas: [...new Set(sugerencias.filter((s) => s.tema === id).map((s) => s.texto))],
  })).filter((g) => g.preguntas.length > 0)
}

/** Una pregunta por tema (la primera): las 4 del chat vacío. */
export function sugerenciasDestacadas(sugerencias: Sugerencia[] = SUGERENCIAS): Sugerencia[] {
  return agruparPorTema(sugerencias).map((g) => ({ tema: g.tema, texto: g.preguntas[0] }))
}
