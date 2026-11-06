import type { ReporteHibridoResponse } from "../types/reports-hybrid.types"
import type { Reporte } from "../types/reports.types"

const PATRONES_META = [
  /que\s*(podes|puedes|sabes)\s*hacer/,
  /en\s*que\s*(me\s*)?(podes|puedes)\s*ayudar/,
  /que\s*(preguntas?|cosas?)\s*(te\s*)?puedo\s*(preguntar|hacer)/,
  /^\s*ayuda\s*$/,
  /como\s*(te\s*)?uso/,
  /^\s*(hola|hey|hi)\s*[.!]?\s*$/,
]

function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

/**
 * Preguntas del tipo "¿qué podés hacer?" no necesitan ir hasta el modelo:
 * se responden al toque, gratis, y funcionan aunque no haya `IA_API_KEY` configurada.
 */
export function respuestaMeta(texto: string): string | null {
  const normalizado = normalizar(texto)
  if (!PATRONES_META.some((patron) => patron.test(normalizado))) return null
  return (
    "Soy tu asistente de reportes. Puedo responder preguntas sobre ventas, " +
    "inventario, reservas, cupones, compras, usuarios, productos, sucursales " +
    "o proveedores — siempre con números reales de la base de datos, nunca " +
    'inventados. Por ejemplo: "¿Cuánto vendí este mes por sucursal?", ' +
    '"Top 5 productos más vendidos" o "¿Cuántas reservas se cancelaron?".'
  )
}

/** Título corto para el tab del reporte nuevo. */
export function tituloDesdeTexto(texto: string, limite = 32): string {
  const limpio = texto.trim().replace(/\s+/g, " ")
  if (limpio.length <= limite) return limpio
  return `${limpio.slice(0, limite - 1).trimEnd()}…`
}

export function mapHibridoAReporte(h: ReporteHibridoResponse): Reporte {
  return {
    ficha: {
      metrica: h.metrica || (h.esSimulacion ? "simulacion" : "hibrido"),
      agruparPor: "hibrido",
      filtros: {},
      orden: "desc",
      limite: h.filas.length,
    },
    filas: h.filas.map((f, i) => ({
      clave: String(i),
      etiqueta: f.etiqueta,
      valor: f.valor,
      valorProyectado: f.valorProyectado,
      valorOriginal: f.valorOriginal,
      detalles: f.detalles,
    })),
    comparacion: null,
    narrativa: h.narrativa,
    pasosEjecutados: h.pasosEjecutados,
    esSimulacion: h.esSimulacion,
    tipoGraficoSugerido: h.tipoGraficoSugerido,
  }
}
