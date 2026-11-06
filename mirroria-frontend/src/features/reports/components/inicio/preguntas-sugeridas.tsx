import { ArrowRight } from "@phosphor-icons/react"
import { agruparPorTema } from "../../lib/inicio-sugerencias"
import { ICONO_TEMA } from "./icono-tema"

interface PreguntasSugeridasProps {
  onPreguntar: (texto: string) => void
  preguntando: boolean
}

const GRUPOS = agruparPorTema()

/** Preguntas listas para usar, por tema: cada fila dispara la pregunta a la IA. */
export function PreguntasSugeridas({ onPreguntar, preguntando }: PreguntasSugeridasProps) {
  return (
    <section aria-labelledby="titulo-sugeridas" className="space-y-3">
      <div className="space-y-0.5">
        <h2 id="titulo-sugeridas" className="text-base font-semibold">Preguntas para empezar</h2>
        <p className="text-sm text-muted-foreground">
          Tocá una y la IA arma el reporte. También podés escribir la tuya en el asistente.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 rounded-xl border border-border bg-card p-4 sm:p-5 @2xl:grid-cols-2">
        {GRUPOS.map((g) => {
          const Icono = ICONO_TEMA[g.tema]
          return (
            <div key={g.tema} className="min-w-0">
              <h3 className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                <Icono className="size-4 text-primary" />
                {g.nombre}
              </h3>
              <ul className="divide-y divide-border/70">
                {g.preguntas.map((p) => (
                  <li key={p}>
                    <button
                      type="button"
                      disabled={preguntando}
                      onClick={() => onPreguntar(p)}
                      className="group flex w-full items-center justify-between gap-3 rounded-md px-2 py-2.5 text-left text-sm text-foreground/90 transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="min-w-0">{p}</span>
                      <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
