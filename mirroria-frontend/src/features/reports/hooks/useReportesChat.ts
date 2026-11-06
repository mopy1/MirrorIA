import { useState } from "react"
import { ApiError } from "@/lib/api"
import { reportsApi } from "../api/reportsApi"
import { mapHibridoAReporte, respuestaMeta, tituloDesdeTexto } from "../lib/reportes-chat.utils"
import type { ChatMessage, ReportTab } from "../types/chat.types"
import type { Reporte } from "../types/reports.types"

const TAB_RESUMEN: ReportTab = { id: "resumen", tipo: "resumen", titulo: "Resumen" }

export function useReportesChat() {
  const [mensajes, setMensajes] = useState<ChatMessage[]>([])
  const [tabs, setTabs] = useState<ReportTab[]>([TAB_RESUMEN])
  const [tabActivaId, setTabActivaId] = useState("resumen")
  const [cargando, setCargando] = useState(false)

  function agregarMensaje(msg: Omit<ChatMessage, "id">) {
    setMensajes((prev) => [...prev, { ...msg, id: crypto.randomUUID() }])
  }

  async function enviarPregunta(textoCrudo: string) {
    const texto = textoCrudo.trim()
    if (texto.length < 3) return
    agregarMensaje({ rol: "usuario", texto })

    const meta = respuestaMeta(texto)
    if (meta) {
      agregarMensaje({ rol: "asistente", texto: meta, tono: "normal" })
      return
    }

    const tabId = crypto.randomUUID()
    const titulo = tituloDesdeTexto(texto)
    setTabs((prev) => [...prev, { id: tabId, tipo: "reporte", titulo, reporte: null, cargando: true }])
    setTabActivaId(tabId)
    setCargando(true)

    try {
      const hibrido = await reportsApi.preguntarHibrido(texto)
      const reporte = mapHibridoAReporte(hibrido)
      setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, reporte, cargando: false } : t)))
      agregarMensaje({
        rol: "asistente",
        texto: hibrido.narrativa ?? `Listo — mirá la pestaña "${titulo}".`,
        tono: "normal",
        reporteTabId: tabId,
        pasosEjecutados: hibrido.pasosEjecutados,
      })
    } catch (e) {
      setTabs((prev) => prev.filter((t) => t.id !== tabId))
      setTabActivaId((actual) => (actual === tabId ? "resumen" : actual))
      const msg = e instanceof ApiError ? e.message : "No se pudo generar el reporte."
      agregarMensaje({ rol: "asistente", texto: msg, tono: e instanceof ApiError && e.status === 422 ? "aclaracion" : "error" })
    } finally {
      setCargando(false)
    }
  }

  function abrirTabConReporte(reporte: Reporte, titulo: string): string {
    const tabId = crypto.randomUUID()
    setTabs((prev) => [...prev, { id: tabId, tipo: "reporte", titulo, reporte, cargando: false }])
    setTabActivaId(tabId)
    return tabId
  }

  function actualizarReporteTab(id: string, nuevoReporte: Reporte) {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, reporte: nuevoReporte } : t)))
  }

  function cerrarTab(id: string) {
    if (id === "resumen") return
    setTabs((prev) => prev.filter((t) => t.id !== id))
    setTabActivaId((actual) => (actual === id ? "resumen" : actual))
  }

  function abrirTab(id: string) {
    if (tabs.some((t) => t.id === id)) setTabActivaId(id)
  }

  return {
    mensajes,
    tabs,
    tabActivaId,
    setTabActivaId,
    enviarPregunta,
    abrirTabConReporte,
    actualizarReporteTab,
    cerrarTab,
    abrirTab,
    cargando,
  }
}
