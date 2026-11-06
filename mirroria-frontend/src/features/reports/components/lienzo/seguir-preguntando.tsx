import { ArrowRight, ChatCircleText } from "@phosphor-icons/react"

interface SeguirPreguntandoProps {
  /** La pregunta con la que cerró la IA (va primero, es la más pertinente). */
  preguntaFinal: string | null
  sugerencias: string[]
  onPreguntar: (texto: string) => void
}

/** Filas clicables que mandan la pregunta al asistente. */
export function SeguirPreguntando({ preguntaFinal, sugerencias, onPreguntar }: SeguirPreguntandoProps) {
  const items = [...(preguntaFinal ? [preguntaFinal] : []), ...sugerencias]
  if (items.length === 0) return null
  return (
    <ul className="-mx-2 flex flex-col">
      {items.map((texto, i) => (
        <li key={texto}>
          <button
            type="button"
            onClick={() => onPreguntar(texto)}
            className="group flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-left text-sm text-foreground outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChatCircleText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1 text-pretty">
              {texto}
              {i === 0 && preguntaFinal && <span className="ml-1.5 text-xs text-muted-foreground">· te lo propone la IA</span>}
            </span>
            <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  )
}
