import { ArrowClockwise, Sparkle, WarningCircle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "cn"
import type { ChatMessage } from "../../types/chat.types"
import { NarrativaMarkdown } from "../narrativa-markdown"
import { TarjetaReporteListo } from "./tarjeta-reporte-listo"

interface ChatMessageItemProps {
  mensaje: ChatMessage
  reporteAbierto: boolean
  ocupado: boolean
  onVerReporte: (mensaje: ChatMessage) => void
  onReintentar: (mensaje: ChatMessage) => void
  onPreguntar: (texto: string) => void
}

/** Una burbuja. La del asistente muestra solo la conclusión corta + la tarjeta del
 * reporte (el análisis completo vive en el lienzo, nunca acá). */
export function ChatMessageItem({ mensaje, reporteAbierto, ocupado, onVerReporte, onReintentar, onPreguntar }: ChatMessageItemProps) {
  if (mensaje.rol === "usuario") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-[13px] leading-relaxed whitespace-pre-line text-primary-foreground">
          {mensaje.texto}
        </p>
      </div>
    )
  }

  const esError = mensaje.tono === "error"
  const Icono = esError ? WarningCircle : Sparkle

  return (
    <div className="flex gap-2.5">
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full",
          esError ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
        )}
      >
        <Icono className="size-4" weight={esError ? "bold" : "fill"} />
      </span>
      <div className="min-w-0 flex-1 space-y-2.5 pt-1">
        <NarrativaMarkdown texto={mensaje.texto} compacto className={cn(esError && "text-foreground")} />
        {mensaje.sugerencias && mensaje.sugerencias.length > 0 && (
          <div className="flex flex-col items-start gap-1.5">
            {mensaje.sugerencias.map((s) => (
              <Button key={s} variant="outline" size="sm" className="h-auto max-w-full py-1.5 text-left text-xs font-normal whitespace-normal" disabled={ocupado} onClick={() => onPreguntar(s)}>
                {s}
              </Button>
            ))}
          </div>
        )}
        {esError && mensaje.reintentable && mensaje.pregunta && (
          <Button variant="outline" size="sm" className="gap-1.5" disabled={ocupado} onClick={() => onReintentar(mensaje)}>
            <ArrowClockwise className="size-3.5" />
            Reintentar
          </Button>
        )}
        {mensaje.reporteTabId && (
          <TarjetaReporteListo
            titulo={mensaje.reporteTitulo ?? "Reporte"}
            abierto={reporteAbierto}
            deshabilitado={ocupado}
            onClick={() => onVerReporte(mensaje)}
          />
        )}
      </div>
    </div>
  )
}
