import { Sparkle } from "@phosphor-icons/react"
import { sugerenciasDestacadas } from "../../lib/inicio-sugerencias"
import { ICONO_TEMA } from "../inicio/icono-tema"

const SUGERENCIAS = sugerenciasDestacadas()

/** Chat sin mensajes: saludo corto + una pregunta por tema. */
export function ChatVacio({ onPreguntar, deshabilitado }: { onPreguntar: (t: string) => void; deshabilitado: boolean }) {
  return (
    <div className="flex flex-1 flex-col justify-end gap-5 overflow-y-auto p-4">
      <div className="space-y-2">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkle className="size-5" weight="fill" />
        </span>
        <p className="text-sm font-semibold">Hola, ¿qué querés saber de tu tienda?</p>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Preguntá en tus palabras: armo el reporte con los datos reales y te digo qué conviene mirar.
        </p>
      </div>
      <ul className="space-y-1.5" aria-label="Preguntas sugeridas">
        {SUGERENCIAS.map((s) => {
          const Icono = ICONO_TEMA[s.tema]
          return (
            <li key={s.texto}>
              <button
                type="button"
                disabled={deshabilitado}
                onClick={() => onPreguntar(s.texto)}
                className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2 text-left text-[13px] transition-colors duration-150 hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
              >
                <Icono className="size-4 shrink-0 text-primary" />
                <span className="min-w-0">{s.texto}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
