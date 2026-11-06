import { useReportesIniciales } from "../hooks/useReportesIniciales"
import type { DatosCifras } from "../lib/inicio-cifras"
import type { TabReporte } from "../types/chat.types"
import { CifrasInicio } from "./inicio/cifras-inicio"
import { GraficoInicio } from "./inicio/grafico-inicio"
import { PreguntasSugeridas } from "./inicio/preguntas-sugeridas"
import { ReportesSesion } from "./inicio/reportes-sesion"

interface ResumenReportesProps {
  reportes: TabReporte[]
  onAbrirTab: (id: string) => void
  onPreguntar: (texto: string) => void
  preguntando: boolean
}

/** Pestaña "Resumen": cifras con contexto, reportes abiertos, preguntas para empezar
 * y los gráficos iniciales. Los datos salen de `useReportesIniciales` (sin IA).
 * `@container`: el ancho real es lo que deja el panel del asistente, no la ventana. */
export function ResumenReportes({ reportes, onAbrirTab, onPreguntar, preguntando }: ResumenReportesProps) {
  const { cifras, graficos, recargar } = useReportesIniciales()

  function recargarCifrasFallidas() {
    const claves = Object.keys(cifras) as (keyof DatosCifras)[]
    for (const k of claves) if (cifras[k] === null) recargar(k)
  }

  return (
    <div className="@container space-y-8">
      <CifrasInicio datos={cifras} onReintentar={recargarCifrasFallidas} />
      <ReportesSesion reportes={reportes} onAbrir={onAbrirTab} />
      <PreguntasSugeridas onPreguntar={onPreguntar} preguntando={preguntando} />
      <section aria-label="Gráficos de tu tienda" className="grid grid-cols-1 gap-4 @3xl:grid-cols-2">
        {graficos.map(({ def, dato }) => (
          <GraficoInicio
            key={def.id}
            def={def}
            dato={dato}
            onReintentar={() => recargar(def.id)}
            onPreguntar={onPreguntar}
            preguntando={preguntando}
          />
        ))}
      </section>
    </div>
  )
}
