import type { TonoMensaje } from "../types/chat.types"
import type { ReporteHibridoResponse } from "../types/reports-hybrid.types"
import type { Reporte } from "../types/reports.types"
import { sugerenciasDestacadas } from "./inicio-sugerencias"
import { extraerConclusion } from "./narrativa"

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
    "Armo reportes con los datos reales de tu tienda: **ventas, prendas, stock, reservas, " +
    "cupones, clientas, compras a proveedores y sucursales**. Preguntame en tus palabras, " +
    'por ejemplo "¿Cuánto vendí este mes por sucursal?" o "Top 5 productos más vendidos".'
  )
}

/** Título de la pestaña: la pregunta entera, normalizada (la tira la trunca con CSS). */
export function tituloDesdeTexto(texto: string, limite = 120): string {
  const limpio = texto.trim().replace(/\s+/g, " ")
  const conMayuscula = limpio.charAt(0).toUpperCase() + limpio.slice(1)
  if (conMayuscula.length <= limite) return conMayuscula
  return `${conMayuscula.slice(0, limite - 1).trimEnd()}…`
}

/** Texto de la burbuja cuando el reporte quedó listo: SOLO la conclusión corta. */
export function textoReporteListo(narrativa: string | null | undefined): string {
  return extraerConclusion(narrativa, 220) ?? "Listo: armé el reporte con los datos de tu tienda."
}

export interface Fallo {
  texto: string
  tono: Exclude<TonoMensaje, "normal">
  reintentable: boolean
  sugerencias?: string[]
}

/**
 * Traduce un fallo de `POST /ia/reportes/hibrido` a un mensaje humano con acción.
 * `status` null = no hubo respuesta (red caída). El 422 no es una falla: es una
 * pregunta fuera de tema y se responde con ejemplos clicables.
 */
export function describirFallo(status: number | null, mensaje?: string): Fallo {
  if (status === 422) {
    return {
      tono: "aclaracion",
      reintentable: false,
      texto: "Eso no lo puedo responder con los datos de tu tienda. Probá preguntar por ventas, prendas, reservas, clientas o proveedores, por ejemplo:",
      sugerencias: sugerenciasDestacadas().slice(0, 2).map((s) => s.texto),
    }
  }
  if (status === null) {
    return { tono: "error", reintentable: true, texto: "No me pude conectar con el servidor. Revisá tu conexión y probá de nuevo." }
  }
  if (status === 503) {
    return {
      tono: "error",
      reintentable: false,
      texto: "La IA no está disponible en este momento. Mientras tanto podés usar **Armar un reporte sin IA**, arriba a la derecha.",
    }
  }
  if (status === 504) {
    return {
      tono: "error",
      reintentable: true,
      texto: "La IA tardó demasiado en responder. Probá de nuevo; si se repite, hacé la pregunta más concreta (por ejemplo, agregando el mes).",
    }
  }
  if (status === 403 && mensaje) return { tono: "error", reintentable: false, texto: mensaje }
  if (status === 400) {
    return { tono: "error", reintentable: false, texto: "No pude cruzar esos datos en un mismo reporte. Probá preguntarlo de otra forma." }
  }
  return { tono: "error", reintentable: true, texto: "No pude armar el reporte por un problema del servidor. Probá de nuevo en un momento." }
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
