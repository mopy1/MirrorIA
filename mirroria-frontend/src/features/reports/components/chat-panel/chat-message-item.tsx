import { ArrowRight, Sparkle, User, WarningCircle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "cn"
import type { ChatMessage } from "../../types/chat.types"

const ESTILO_TONO: Record<NonNullable<ChatMessage["tono"]>, string> = {
  normal: "bg-muted text-foreground",
  aclaracion: "bg-primary/5 text-foreground border border-primary/20",
  error: "bg-destructive/10 text-destructive border border-destructive/20",
}

interface ChatMessageItemProps {
  mensaje: ChatMessage
  onAbrirTab: (id: string) => void
}

/** Una burbuja del feed. El asistente nunca se pinta como error salvo que
 * `tono === "error"` de verdad (ver useReportesChat) — una aclaración del
 * asistente (422) es conversación normal, no una falla de la app. */
export function ChatMessageItem({ mensaje, onAbrirTab }: ChatMessageItemProps) {
  const esUsuario = mensaje.rol === "usuario"

  if (esUsuario) {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
          {mensaje.texto}
        </div>
        <User className="mt-1 size-5 shrink-0 text-muted-foreground" />
      </div>
    )
  }

  const tono = mensaje.tono ?? "normal"
  const Icono = tono === "error" ? WarningCircle : Sparkle

  return (
    <div className="flex gap-2">
      <Icono
        className={cn("mt-1 size-5 shrink-0", tono === "error" ? "text-destructive" : "text-primary")}
        weight={tono === "error" ? "regular" : "fill"}
      />
      <div className={cn("max-w-[85%] space-y-2 rounded-2xl rounded-tl-sm px-3 py-2 text-sm", ESTILO_TONO[tono])}>
        <p className="leading-relaxed">{mensaje.texto}</p>
        {mensaje.reporteTabId && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-primary hover:text-primary"
            onClick={() => onAbrirTab(mensaje.reporteTabId!)}
          >
            Ver reporte
            <ArrowRight className="size-3" />
          </Button>
        )}
      </div>
    </div>
  )
}
