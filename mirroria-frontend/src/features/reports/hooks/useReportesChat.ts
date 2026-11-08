import { useState } from "react"
import { ApiError } from "@/lib/api"
import { reportsApi } from "../api/reportsApi"
import { formatoPedido } from "../lib/formato-pedido"
import { descargarReporte } from "./useExportarExcel"
import { describirFallo, mapHibridoAReporte, respuestaMeta, textoReporteListo, tituloDesdeTexto } from "../lib/reportes-chat.utils"
import type { ChatMessage, ReportTab, TabReporte } from "../types/chat.types"
import type { Reporte } from "../types/reports.types"

const TAB_RESUMEN: ReportTab = { id: "resumen", tipo: "resumen", titulo: "Resumen" }

/** Conversación con la IA + pestañas de reportes. Cada pregunta abre su pestaña;
 * si falla, la pestaña queda con el error y "Reintentar" (salvo una aclaración 422,
 * que no es un reporte: se cierra y la respuesta queda solo en el chat). */
export function useReportesChat() {
  const [mensajes, setMensajes] = useState<ChatMessage[]>([])
  const [tabs, setTabs] = useState<ReportTab[]>([TAB_RESUMEN])
  const [tabActivaId, setTabActivaId] = useState("resumen")

  const reportes = tabs.filter((t): t is TabReporte => t.tipo === "reporte")
  const enCurso = reportes.find((t) => t.cargando)

  function agregarMensaje(msg: Omit<ChatMessage, "id">) {
    setMensajes((prev) => [...prev, { ...msg, id: crypto.randomUUID() }])
  }

  function actualizarTab(id: string, cambios: Partial<TabReporte>) {
    setTabs((prev) => prev.map((t) => (t.id === id && t.tipo === "reporte" ? { ...t, ...cambios } : t)))
  }

  function cerrarTab(id: string) {
    if (id === "resumen") return
    setTabs((prev) => prev.filter((t) => t.id !== id))
    setTabActivaId((actual) => (actual === id ? "resumen" : actual))
  }

  async function generar(tabId: string, pregunta: string, titulo: string) {
    actualizarTab(tabId, { cargando: true, error: undefined, iniciadoEn: Date.now() })
    try {
      const hibrido = await reportsApi.preguntarHibrido(pregunta)
      const reporte = mapHibridoAReporte(hibrido)
      actualizarTab(tabId, { reporte, cargando: false, generadoEn: new Date() })
      const formato = formatoPedido(pregunta)
      if (formato && reporte.filas.length > 0) {
        descargarReporte(reporte, titulo, formato).catch(() =>
          agregarMensaje({ rol: "asistente", texto: "El reporte está listo, pero no pude generar el archivo. Probá con el botón de exportar.", tono: "error" }),
        )
      }
      agregarMensaje({ rol: "asistente", texto: textoReporteListo(hibrido.narrativa), tono: "normal", reporteTabId: tabId, reporteTitulo: titulo, pregunta })
    } catch (e) {
      const fallo = describirFallo(e instanceof ApiError ? e.status : null, e instanceof Error ? e.message : undefined)
      if (fallo.tono === "aclaracion") cerrarTab(tabId)
      else actualizarTab(tabId, { cargando: false, error: fallo.texto, reintentable: fallo.reintentable })
      agregarMensaje({ rol: "asistente", ...fallo, pregunta })
    }
  }

  async function enviarPregunta(textoCrudo: string) {
    const texto = textoCrudo.trim()
    if (texto.length < 3 || enCurso) return
    agregarMensaje({ rol: "usuario", texto })

    const meta = respuestaMeta(texto)
    if (meta) {
      agregarMensaje({ rol: "asistente", texto: meta, tono: "normal" })
      return
    }

    const id = crypto.randomUUID()
    const titulo = tituloDesdeTexto(texto)
    setTabs((prev) => [...prev, { id, tipo: "reporte", titulo, pregunta: texto, reporte: null, cargando: true, iniciadoEn: Date.now() }])
    setTabActivaId(id)
    await generar(id, texto, titulo)
  }

  /** Reintenta en la MISMA pestaña (no abre otra). */
  async function reintentar(tabId: string) {
    const tab = reportes.find((t) => t.id === tabId)
    if (!tab?.pregunta || enCurso) return
    setTabActivaId(tabId)
    await generar(tabId, tab.pregunta, tab.titulo)
  }

  function abrirTabConReporte(reporte: Reporte, titulo: string): string {
    const id = crypto.randomUUID()
    const ahora = Date.now()
    setTabs((prev) => [...prev, { id, tipo: "reporte", titulo, reporte, cargando: false, iniciadoEn: ahora, generadoEn: new Date(ahora) }])
    setTabActivaId(id)
    return id
  }

  function actualizarReporteTab(id: string, nuevoReporte: Reporte) {
    actualizarTab(id, { reporte: nuevoReporte })
  }

  /** true si la pestaña sigue abierta (la burbuja ofrece regenerar si ya se cerró). */
  function abrirTab(id: string): boolean {
    if (!tabs.some((t) => t.id === id)) return false
    setTabActivaId(id)
    return true
  }

  return {
    mensajes,
    tabs,
    reportes,
    tabActivaId,
    setTabActivaId,
    enviarPregunta,
    reintentar,
    abrirTabConReporte,
    actualizarReporteTab,
    cerrarTab,
    abrirTab,
    cargando: Boolean(enCurso),
    pensandoDesde: enCurso?.iniciadoEn ?? null,
  }
}
