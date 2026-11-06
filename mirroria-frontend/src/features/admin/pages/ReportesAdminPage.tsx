import { useState } from "react"
import { ChatCircleDots, Sparkle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { ChatPanel } from "@/features/reports/components/chat-panel"
import { ConstructorReporteDialog } from "@/features/reports/components/constructor-reporte"
import { ReportTabs } from "@/features/reports/components/report-tabs"
import { useDictado } from "@/features/reports/hooks/useDictado"
import { useReportesChat } from "@/features/reports/hooks/useReportesChat"
import { useTecladoDictado } from "@/features/reports/hooks/useTecladoDictado"

export function ReportesAdminPage() {
  const {
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
  } = useReportesChat()

  const [pregunta, setPregunta] = useState("")
  const [chatMobileAbierto, setChatMobileAbierto] = useState(false)

  async function preguntar(texto: string) {
    setPregunta("")
    await enviarPregunta(texto)
  }

  const dictado = useDictado({
    onTextoFinal: (texto) => void preguntar(texto),
    onTextoParcial: setPregunta,
  })
  useTecladoDictado(dictado)

  return (
    <div className="p-4 space-y-6 sm:p-6 lg:p-8 lg:pr-[26rem] xl:p-10 xl:pr-[30rem]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2.5">
            <Sparkle className="size-7 text-primary" />
            Reportes Analíticos e Inteligentes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consultá por lenguaje natural con IA o generá reportes dinámicos multidimensionales al instante.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ConstructorReporteDialog onReporteGenerado={(rep, titulo) => abrirTabConReporte(rep, titulo)} />
        </div>
      </div>

      <ReportTabs
        tabs={tabs}
        activaId={tabActivaId}
        onActivar={setTabActivaId}
        onCerrar={cerrarTab}
        onActualizarReporte={actualizarReporteTab}
      />

      <aside className="hidden lg:fixed lg:top-16 lg:right-0 lg:bottom-0 lg:z-30 lg:flex lg:w-96 lg:flex-col lg:border-l lg:border-border lg:bg-card xl:w-[28rem]">
        <ChatPanel
          mensajes={mensajes}
          pregunta={pregunta}
          onPreguntaChange={setPregunta}
          onSubmit={preguntar}
          cargando={cargando}
          dictado={dictado}
          onAbrirTab={abrirTab}
        />
      </aside>

      <Button
        type="button"
        size="icon"
        className="fixed bottom-6 right-6 z-40 size-14 rounded-full shadow-lg lg:hidden"
        onClick={() => setChatMobileAbierto(true)}
        aria-label="Abrir asistente de reportes"
      >
        <ChatCircleDots className="size-6" weight="fill" />
      </Button>
      <Sheet open={chatMobileAbierto} onOpenChange={setChatMobileAbierto}>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
          <ChatPanel
            mensajes={mensajes}
            pregunta={pregunta}
            onPreguntaChange={setPregunta}
            onSubmit={preguntar}
            cargando={cargando}
            dictado={dictado}
            onAbrirTab={(id) => {
              abrirTab(id)
              setChatMobileAbierto(false)
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
