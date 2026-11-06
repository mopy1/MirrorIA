import type { ReactNode } from "react"
import { AvisoSimulacion } from "./aviso-simulacion"

interface EncabezadoReporteProps {
  titulo: string
  metadatos: string
  /** Si es una simulación, el escenario en humano (o null si no se pudo describir). */
  escenario?: string | null
  acciones: ReactNode
}

/** La pregunta como título, una línea de metadatos y las acciones a la derecha (debajo en móvil). */
export function EncabezadoReporte({ titulo, metadatos, escenario, acciones }: EncabezadoReporteProps) {
  return (
    <header className="flex flex-col gap-4 px-4 pt-6 pb-5 sm:px-7 @3xl:flex-row @3xl:items-start @3xl:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl leading-tight font-semibold tracking-tight text-balance text-foreground sm:text-2xl">{titulo}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{metadatos}</p>
        {escenario !== undefined && <AvisoSimulacion escenario={escenario} />}
      </div>
      <div className="shrink-0">{acciones}</div>
    </header>
  )
}
