import { useEffect, useRef } from "react"
import { Sparkle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { ChatMessageItem } from "./chat-message-item"
import type { ChatMessage } from "../../types/chat.types"

const EJEMPLOS = [
  "¿Cuánto vendí este mes por sucursal?",
  "Top 5 productos más vendidos",
  "¿Cuántas reservas se cancelaron?",
  "¿Qué podés hacer?",
]

interface ChatMessageListProps {
  mensajes: ChatMessage[]
  cargando: boolean
  onAbrirTab: (id: string) => void
  onEjemplo: (texto: string) => void
}

/** Feed de conversación con auto-scroll al último mensaje. Vacío, muestra
 * ejemplos clicables (mismos que antes vivían siempre visibles en
 * `PreguntaCard`) — acá solo aparecen antes de la primera pregunta, para no
 * repetirlos abajo de cada respuesta. */
export function ChatMessageList({ mensajes, cargando, onAbrirTab, onEjemplo }: ChatMessageListProps) {
  const finRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [mensajes.length, cargando])

  if (mensajes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <Sparkle className="size-8 text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Preguntame sobre tu negocio</p>
          <p className="text-xs text-muted-foreground">
            Ventas, inventario, reservas, cupones, compras, usuarios, productos, sucursales o
            proveedores.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {EJEMPLOS.map((ej) => (
            <Button
              key={ej}
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full font-normal"
              onClick={() => onEjemplo(ej)}
            >
              {ej}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {mensajes.map((m) => (
        <ChatMessageItem key={m.id} mensaje={m} onAbrirTab={onAbrirTab} />
      ))}
      {cargando && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkle className="size-4 animate-pulse text-primary" />
          Pensando…
        </div>
      )}
      <div ref={finRef} />
    </div>
  )
}
