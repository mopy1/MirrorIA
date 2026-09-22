import { useEffect, useState } from "react"
import { ChatCircleDots, Sparkle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { ChatPanel } from "@/features/reports/components/chat-panel"
import { ReportTabs } from "@/features/reports/components/report-tabs"
import { useDictado } from "@/features/reports/hooks/useDictado"
import { useReportesChat } from "@/features/reports/hooks/useReportesChat"

/** Thin Page: el estado real vive en `useReportesChat` (conversación + tabs
 * de reportes). Layout de dos paneles, mismo espíritu que el chat acoplado
 * de `case-frontend/features/copilot` — panel fijo a la derecha en
 * escritorio, `Sheet` en mobile. */
export function ReportesAdminPage() {
  const { mensajes, tabs, tabActivaId, setTabActivaId, enviarPregunta, cerrarTab, abrirTab, cargando } =
    useReportesChat()
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

  // Barra espaciadora = alternar dictado — igual que antes de este rediseño,
  // ver historial de ReportesAdminPage.tsx en AGENTS.md para el porqué de
  // cada detalle (keydown+keyup, se ignora con foco en un campo de texto).
  useEffect(() => {
    if (!dictado.soportado) return

    function enUnCampoDeTexto() {
      const tag = document.activeElement?.tagName
      return tag === "INPUT" || tag === "TEXTAREA"
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== "Space" || e.repeat || enUnCampoDeTexto()) return
      e.preventDefault()
      dictado.alternar()
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code !== "Space" || enUnCampoDeTexto()) return
      e.preventDefault()
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [dictado])

  return (
    // El padding derecho SIEMPRE deja 2rem más que el ancho real del panel
    // fijo (lg:w-96=24rem -> pr-[26rem], xl:w-[28rem] -> pr-[30rem]) — antes
    // en xl coincidían exacto (28rem = 28rem) y las tarjetas quedaban
    // pegadas al borde del panel sin ningún margen visible entre los dos.
    <div className="p-4 space-y-6 sm:p-6 lg:p-8 lg:pr-[26rem] xl:p-10 xl:pr-[30rem]">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2.5">
          <Sparkle className="size-7 text-primary" />
          Reportes por IA
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preguntale al asistente o mirá el resumen — cada reporte nuevo abre su propia pestaña.
        </p>
      </div>

      <ReportTabs tabs={tabs} activaId={tabActivaId} onActivar={setTabActivaId} onCerrar={cerrarTab} />

      {/* Panel fijo de escritorio — debajo del topbar (h-16) de AdminLayout */}
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

      {/* Disparador + drawer de mobile */}
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
