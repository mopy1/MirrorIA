import { useState } from "react"
import { reportsApi } from "../api/reportsApi"
import { respuestaMeta, tituloDesdeTexto } from "../lib/reportes-chat.utils"
import type { ChatMessage, ReportTab } from "../types/chat.types"
import { ApiError } from "@/lib/api"

const TAB_RESUMEN: ReportTab = { id: "resumen", tipo: "resumen", titulo: "Resumen" }

/** Estado y lógica del asistente de reportes: la conversación (`mensajes`) y
 * los reportes abiertos como tabs (`tabs`) — separado de la página para que
 * `ReportesAdminPage.tsx` se quede como Thin Page (Regla 1.B). */
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

    // Preguntas tipo "¿qué podés hacer?" se responden solas, sin gastar el
    // modelo ni crear un tab de reporte (no hay datos que mostrar).
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
      const reporte = await reportsApi.preguntar(texto)
      setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, reporte, cargando: false } : t)))
      agregarMensaje({
        rol: "asistente",
        texto: reporte.narrativa ?? `Listo — mirá la pestaña "${titulo}".`,
        tono: "normal",
        reporteTabId: tabId,
      })
    } catch (e) {
      // Sin datos que mostrar, el tab que se abrió en optimista no queda
      // colgando vacío — se saca y se vuelve al resumen.
      setTabs((prev) => prev.filter((t) => t.id !== tabId))
      setTabActivaId((actual) => (actual === tabId ? "resumen" : actual))
      // 422 = ConsultaNoComprendidaException: el asistente entendió pero no
      // es pregunta de negocio — es conversación, no una falla (ver Fase 1).
      if (e instanceof ApiError && e.status === 422) {
        agregarMensaje({ rol: "asistente", texto: e.message, tono: "aclaracion" })
      } else {
        agregarMensaje({
          rol: "asistente",
          texto: e instanceof ApiError ? e.message : "No se pudo generar el reporte.",
          tono: "error",
        })
      }
    } finally {
      setCargando(false)
    }
  }

  function cerrarTab(id: string) {
    if (id === "resumen") return
    setTabs((prev) => prev.filter((t) => t.id !== id))
    setTabActivaId((actual) => (actual === id ? "resumen" : actual))
  }

  // A diferencia de `setTabActivaId` (que usa el propio `ReportTabs` con ids
  // siempre válidos, porque salen de los tabs que ya están montados), el
  // "Ver reporte" de una burbuja vieja del chat puede apuntar a un tab que
  // ya se cerró — sin esta guarda, la pantalla se queda sin ningún tab
  // seleccionado y el panel principal queda en blanco.
  function abrirTab(id: string) {
    if (tabs.some((t) => t.id === id)) setTabActivaId(id)
  }

  return { mensajes, tabs, tabActivaId, setTabActivaId, enviarPregunta, cerrarTab, abrirTab, cargando }
}
