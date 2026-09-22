import { Microphone, PaperPlaneTilt } from "@phosphor-icons/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { useDictado } from "../../hooks/useDictado"

interface ChatInputProps {
  pregunta: string
  onPreguntaChange: (texto: string) => void
  onSubmit: (texto: string) => void
  cargando: boolean
  dictado: ReturnType<typeof useDictado>
}

/** Fila de envío del chat — mismo formulario que antes vivía en
 * `PreguntaCard`, angosto para caber en el panel lateral. */
export function ChatInput({ pregunta, onPreguntaChange, onSubmit, cargando, dictado }: ChatInputProps) {
  return (
    <div className="shrink-0 space-y-2 border-t border-border p-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(pregunta)
        }}
      >
        <Input
          value={pregunta}
          onChange={(e) => onPreguntaChange(e.target.value)}
          placeholder="Preguntá algo…"
          aria-label="Pregunta de negocio"
        />
        {dictado.soportado && (
          <Button
            type="button"
            variant={dictado.escuchando ? "default" : "outline"}
            size="icon"
            disabled={cargando}
            onClick={dictado.alternar}
            aria-label={dictado.escuchando ? "Detener dictado (Espacio)" : "Dictar la pregunta (Espacio)"}
            title={dictado.escuchando ? "Detener dictado (Espacio)" : "Dictar (Espacio)"}
          >
            <Microphone weight={dictado.escuchando ? "fill" : "regular"} />
          </Button>
        )}
        <Button type="submit" size="icon" disabled={cargando} aria-label="Enviar">
          <PaperPlaneTilt />
        </Button>
      </form>
      {dictado.escuchando && (
        <p className="text-xs text-muted-foreground">Escuchando… apretá Espacio de nuevo para terminar.</p>
      )}
      {dictado.error && (
        <Alert variant="destructive" className="py-1.5">
          <AlertDescription className="text-xs">{dictado.error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
