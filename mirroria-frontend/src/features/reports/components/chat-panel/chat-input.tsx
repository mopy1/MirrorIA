import type { KeyboardEvent } from "react"
import { Microphone, PaperPlaneRight, SpinnerGap } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { useDictado } from "../../hooks/useDictado"

interface ChatInputProps {
  pregunta: string
  onPreguntaChange: (texto: string) => void
  onSubmit: (texto: string) => void
  cargando: boolean
  dictado: ReturnType<typeof useDictado>
}

/** Compositor: textarea que crece, Enter envía y Shift+Enter hace salto de línea. */
export function ChatInput({ pregunta, onPreguntaChange, onSubmit, cargando, dictado }: ChatInputProps) {
  const vacia = pregunta.trim().length < 3

  function enTecla(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return
    e.preventDefault()
    if (!vacia && !cargando) onSubmit(pregunta)
  }

  return (
    <div className="shrink-0 border-t border-border bg-card p-3">
      <form
        className="rounded-xl border border-input bg-background transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30"
        onSubmit={(e) => {
          e.preventDefault()
          if (!vacia && !cargando) onSubmit(pregunta)
        }}
      >
        <Textarea
          value={pregunta}
          onChange={(e) => onPreguntaChange(e.target.value)}
          onKeyDown={enTecla}
          rows={1}
          placeholder="Ej.: ¿qué vendí más este mes?"
          aria-label="Tu pregunta para la IA"
          className="max-h-40 min-h-11 resize-none border-0 bg-transparent px-3 pt-2.5 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <div className="flex items-center justify-between gap-2 px-2 pb-2">
          <p className="hidden pl-1 text-[11px] text-muted-foreground sm:block">
            {dictado.escuchando
              ? "Escuchando… tocá el micrófono para terminar"
              : dictado.transcribiendo
                ? "Pasando tu voz a texto…"
                : "Enter envía · Shift+Enter, otra línea"}
          </p>
          <div className="ml-auto flex items-center gap-1.5">
            {dictado.soportado && (
              <Button
                type="button"
                variant={dictado.escuchando ? "secondary" : "ghost"}
                size="icon-sm"
                disabled={cargando || dictado.transcribiendo}
                onClick={dictado.alternar}
                aria-pressed={dictado.escuchando}
                aria-label={dictado.escuchando ? "Terminar el dictado" : "Dictar la pregunta"}
                title={dictado.escuchando ? "Terminar el dictado (Espacio)" : "Dictar la pregunta (Espacio)"}
              >
                <Microphone className={dictado.escuchando ? "text-primary" : undefined} weight={dictado.escuchando ? "fill" : "regular"} />
              </Button>
            )}
            <Button type="submit" size="icon-sm" disabled={vacia || cargando} aria-label={cargando ? "Generando el reporte" : "Enviar pregunta"}>
              {cargando ? <SpinnerGap className="animate-spin" /> : <PaperPlaneRight weight="fill" />}
            </Button>
          </div>
        </div>
      </form>
      {dictado.error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {dictado.error}
        </p>
      )}
    </div>
  )
}
