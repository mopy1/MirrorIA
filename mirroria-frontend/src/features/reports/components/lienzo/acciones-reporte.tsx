import { useEffect, useState } from "react"
import { Check, Copy, FileXls, SpinnerGap, X } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { useExportarExcel } from "../../hooks/useExportarExcel"
import type { Reporte } from "../../types/reports.types"

interface AccionesReporteProps {
  reporte: Reporte
  titulo: string
  /** Texto plano que se copia con "Copiar resumen". */
  resumen: string
  onCerrar?: () => void
}

/** Exportar a Excel (principal) · Copiar resumen · Cerrar. El error de exportación se dice en texto, con la salida. */
export function AccionesReporte({ reporte, titulo, resumen, onCerrar }: AccionesReporteProps) {
  const { exportar, exportando, error } = useExportarExcel(reporte, titulo)
  const [copiado, setCopiado] = useState<"si" | "error" | null>(null)

  useEffect(() => {
    if (!copiado) return
    const t = window.setTimeout(() => setCopiado(null), 2000)
    return () => window.clearTimeout(t)
  }, [copiado])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(resumen)
      setCopiado("si")
    } catch {
      setCopiado("error")
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="lg" onClick={exportar} disabled={exportando || reporte.filas.length === 0}>
          {exportando ? <SpinnerGap className="size-4 motion-safe:animate-spin" aria-hidden /> : <FileXls className="size-4" aria-hidden />}
          {exportando ? "Preparando Excel…" : "Exportar a Excel"}
        </Button>
        <Button size="lg" variant="outline" onClick={copiar}>
          {copiado === "si" ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copiado === "si" ? "Copiado" : "Copiar resumen"}
        </Button>
        {onCerrar && (
          <Button size="icon-lg" variant="ghost" onClick={onCerrar} aria-label="Cerrar este reporte" title="Cerrar este reporte">
            <X className="size-4" aria-hidden />
          </Button>
        )}
      </div>
      <p role="status" className="text-xs empty:hidden">
        {error && <span className="text-destructive">{error}</span>}
        {copiado === "error" && <span className="text-destructive">Tu navegador no dejó copiar. Seleccioná el texto y copialo a mano.</span>}
      </p>
    </div>
  )
}
