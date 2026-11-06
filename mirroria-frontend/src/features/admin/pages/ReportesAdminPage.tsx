import { useState } from "react"
import { Sparkle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { ChatPanel } from "@/features/reports/components/chat-panel"
import { EncabezadoReportes } from "@/features/reports/components/inicio/encabezado-reportes"
import { ReportTabs } from "@/features/reports/components/report-tabs"
import { useDictado } from "@/features/reports/hooks/useDictado"
import { useReportesChat } from "@/features/reports/hooks/useReportesChat"
import { useTecladoDictado } from "@/features/reports/hooks/useTecladoDictado"
import type { ChatMessage } from "@/features/reports/types/chat.types"

/** Reportes con IA: lienzo con pestañas a la izquierda y asistente a la derecha
 * (en pantallas < lg el asistente vive en un Sheet inferior). */
export function ReportesAdminPage() {
  const chat = useReportesChat()
  const [pregunta, setPregunta] = useState("")
  const [chatMovilAbierto, setChatMovilAbierto] = useState(false)

  function preguntar(texto: string) {
    // Mientras se genera otro reporte no se borra lo escrito (el envío está bloqueado).
    if (chat.cargando) return
    setPregunta("")
    void chat.enviarPregunta(texto)
  }

  const dictado = useDictado({ onTextoFinal: preguntar, onTextoParcial: setPregunta })
  useTecladoDictado(dictado)

  function verReporte(m: ChatMessage) {
    if (m.reporteTabId && chat.abrirTab(m.reporteTabId)) setChatMovilAbierto(false)
    else if (m.pregunta) preguntar(m.pregunta)
  }

  function reintentar(m: ChatMessage) {
    const tab = chat.reportes.find((t) => t.error && t.pregunta === m.pregunta)
    if (tab) void chat.reintentar(tab.id)
    else if (m.pregunta) preguntar(m.pregunta)
  }

  const panel = (
    <ChatPanel
      mensajes={chat.mensajes}
      idsAbiertos={new Set(chat.reportes.map((t) => t.id))}
      pensandoDesde={chat.pensandoDesde}
      pregunta={pregunta}
      onPreguntaChange={setPregunta}
      dictado={dictado}
      onPreguntar={preguntar}
      onVerReporte={verReporte}
      onReintentar={reintentar}
    />
  )

  return (
    <div className="space-y-6 p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pr-[26rem] xl:px-10 xl:pr-[28.5rem]">
      <EncabezadoReportes onReporteGenerado={(rep, titulo) => chat.abrirTabConReporte(rep, titulo)} />

      <ReportTabs
        tabs={chat.tabs}
        activaId={chat.tabActivaId}
        onActivar={chat.setTabActivaId}
        onCerrar={chat.cerrarTab}
        onReintentar={(id) => void chat.reintentar(id)}
        onPreguntar={preguntar}
        preguntando={chat.cargando}
        onActualizarReporte={chat.actualizarReporteTab}
      />

      <aside
        aria-label="Asistente de reportes"
        className="hidden lg:fixed lg:top-16 lg:right-0 lg:bottom-0 lg:z-30 lg:flex lg:w-96 lg:flex-col lg:border-l lg:border-border lg:bg-card xl:w-[26rem]"
      >
        {panel}
      </aside>

      <Button
        type="button"
        className="fixed right-4 bottom-4 z-40 h-11 gap-2 rounded-full px-5 shadow-[0_6px_20px_-6px_rgb(0_0_0/0.35)] lg:hidden"
        onClick={() => setChatMovilAbierto(true)}
      >
        <Sparkle className="size-4" weight="fill" />
        Preguntar a la IA
      </Button>
      <Sheet open={chatMovilAbierto} onOpenChange={setChatMovilAbierto}>
        <SheetContent side="bottom" className="h-[88dvh] gap-0 rounded-t-2xl p-0 lg:hidden">
          <SheetTitle className="sr-only">Asistente de reportes</SheetTitle>
          {panel}
        </SheetContent>
      </Sheet>
    </div>
  )
}
