export type FormatoReporte = "pdf" | "excel"

/** "ventas por sucursal en pdf": quien pregunta puede pedir el archivo en la misma frase. */
export function formatoPedido(texto: string): FormatoReporte | null {
  if (/\bpdf\b/i.test(texto)) return "pdf"
  if (/\b(excel|xlsx|planilla|hoja de c[aá]lculo)\b/i.test(texto)) return "excel"
  return null
}

const EXTENSION: Record<FormatoReporte, string> = { pdf: "pdf", excel: "xlsx" }

/** Nombre legible a partir del título: "top-5-productos-mas-vendidos_2026-11-06.xlsx". */
export function nombreArchivoReporte(titulo: string, formato: FormatoReporte, fecha = new Date()): string {
  const slug = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
  return `${slug || "reporte"}_${fecha.toISOString().slice(0, 10)}.${EXTENSION[formato]}`
}
