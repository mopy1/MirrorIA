import { Sparkle } from "@phosphor-icons/react"
import type { useDictado } from "../../hooks/useDictado"
import type { ChatMessage } from "../../types/chat.types"
import { ChatInput } from "./chat-input"
import { ChatMessageList, type AccionesChat } from "./chat-message-list"

interface ChatPanelProps extends AccionesChat {
  mensajes: ChatMessage[]
  idsAbiertos: ReadonlySet<string>
  pensandoDesde: number | null
  pregunta: string
  onPreguntaChange: (texto: string) => void
  dictado: ReturnType<typeof useDictado>
}

/** El asistente: mismo componente en el panel de escritorio y en el `Sheet` de
 * pantallas chicas (ver `ReportesAdminPage.tsx`), así el historial no se duplica. */
export function ChatPanel({ mensajes, idsAbiertos, pensandoDesde, pregunta, onPreguntaChange, dictado, ...acciones }: ChatPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-border px-4 py-3">
        <Sparkle className="size-4.5 text-primary" weight="fill" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Asistente de reportes</h2>
          <p className="text-xs text-muted-foreground">Responde con los datos reales de tu tienda</p>
        </div>
      </div>
      <ChatMessageList mensajes={mensajes} idsAbiertos={idsAbiertos} pensandoDesde={pensandoDesde} {...acciones} />
      <ChatInput
        pregunta={pregunta}
        onPreguntaChange={onPreguntaChange}
        onSubmit={acciones.onPreguntar}
        cargando={pensandoDesde !== null}
        dictado={dictado}
      />
    </div>
  )
}
