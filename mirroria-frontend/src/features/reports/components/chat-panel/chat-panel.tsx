import { Sparkle } from "@phosphor-icons/react"
import type { useDictado } from "../../hooks/useDictado"
import type { ChatMessage } from "../../types/chat.types"
import { ChatInput } from "./chat-input"
import { ChatMessageList } from "./chat-message-list"

interface ChatPanelProps {
  mensajes: ChatMessage[]
  pregunta: string
  onPreguntaChange: (texto: string) => void
  onSubmit: (texto: string) => void
  cargando: boolean
  dictado: ReturnType<typeof useDictado>
  onAbrirTab: (id: string) => void
}

/** Contenido del asistente — mismo componente para el panel fijo de
 * escritorio y el `Sheet` de mobile (ver `ReportesAdminPage.tsx`), así el
 * historial y el estado del dictado no se duplican entre los dos. */
export function ChatPanel({
  mensajes,
  pregunta,
  onPreguntaChange,
  onSubmit,
  cargando,
  dictado,
  onAbrirTab,
}: ChatPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
        <Sparkle className="size-4.5 text-primary" weight="fill" />
        <h2 className="text-sm font-semibold">Asistente de reportes</h2>
      </div>
      <ChatMessageList
        mensajes={mensajes}
        cargando={cargando}
        onAbrirTab={onAbrirTab}
        onEjemplo={onSubmit}
      />
      <ChatInput
        pregunta={pregunta}
        onPreguntaChange={onPreguntaChange}
        onSubmit={onSubmit}
        cargando={cargando}
        dictado={dictado}
      />
    </div>
  )
}
