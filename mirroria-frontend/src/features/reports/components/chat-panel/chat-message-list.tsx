import { useEffect, useRef } from "react"
import type { ChatMessage } from "../../types/chat.types"
import { ChatMessageItem } from "./chat-message-item"
import { ChatPensando } from "./chat-pensando"
import { ChatVacio } from "./chat-vacio"

export interface AccionesChat {
  onVerReporte: (mensaje: ChatMessage) => void
  onReintentar: (mensaje: ChatMessage) => void
  onPreguntar: (texto: string) => void
}

interface ChatMessageListProps extends AccionesChat {
  mensajes: ChatMessage[]
  idsAbiertos: ReadonlySet<string>
  pensandoDesde: number | null
}

/** Conversación con autoscroll al último mensaje (o al indicador "pensando"). */
export function ChatMessageList({ mensajes, idsAbiertos, pensandoDesde, ...acciones }: ChatMessageListProps) {
  const finRef = useRef<HTMLDivElement>(null)
  const ocupado = pensandoDesde !== null

  useEffect(() => {
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    finRef.current?.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "end" })
  }, [mensajes.length, ocupado])

  if (mensajes.length === 0 && !ocupado) {
    return <ChatVacio onPreguntar={acciones.onPreguntar} deshabilitado={ocupado} />
  }

  return (
    <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain p-4" aria-live="polite">
      {mensajes.map((m) => (
        <ChatMessageItem
          key={m.id}
          mensaje={m}
          reporteAbierto={Boolean(m.reporteTabId && idsAbiertos.has(m.reporteTabId))}
          ocupado={ocupado}
          {...acciones}
        />
      ))}
      {pensandoDesde !== null && <ChatPensando desde={pensandoDesde} />}
      <div ref={finRef} />
    </div>
  )
}
