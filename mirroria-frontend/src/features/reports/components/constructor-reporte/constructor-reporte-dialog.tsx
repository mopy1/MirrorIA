import { useState } from "react"
import { Play, SlidersHorizontal, SpinnerGap } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useSucursales } from "@/features/branches/hooks/useSucursales"
import { reportsApi } from "../../api/reportsApi"
import type { Ficha, Reporte } from "../../types/reports.types"
import { ConstructorReporteCampos } from "./constructor-reporte-campos"
import {
  calcularPeriodoAnterior,
  DIMENSIONES_DISPONIBLES,
  METRICAS_DISPONIBLES,
  resolverRango,
} from "./constructor-reporte.data"

interface Props {
  onReporteGenerado: (reporte: Reporte, etiqueta: string) => void
}

export function ConstructorReporteDialog({ onReporteGenerado }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metrica, setMetrica] = useState("ingresos")
  const [agruparPor, setAgruparPor] = useState("categoria")
  const [presetFecha, setPresetFecha] = useState("este_mes")
  const [sucursalId, setSucursalId] = useState("todas")
  const [comparar, setComparar] = useState(false)
  const { sucursales } = useSucursales()

  async function ejecutar() {
    try {
      setCargando(true)
      setError(null)
      const fechas = resolverRango(presetFecha)
      const filtros: Record<string, string | undefined> = {
        desde: fechas.desde,
        hasta: fechas.hasta,
        ...(sucursalId !== "todas" ? { sucursalId } : {}),
      }
      const ficha: Partial<Ficha> = { metrica, agruparPor, filtros, orden: "desc", limite: 20 }
      if (comparar) {
        ficha.compararCon = calcularPeriodoAnterior(fechas.desde, fechas.hasta)
      }
      const resultado = await reportsApi.consultar(ficha)
      const nombreMetrica = METRICAS_DISPONIBLES.find((m) => m.id === metrica)?.label ?? metrica
      const nombreDim = DIMENSIONES_DISPONIBLES.find((d) => d.id === agruparPor)?.label ?? agruparPor
      onReporteGenerado(resultado, `${nombreMetrica} por ${nombreDim}`)
      setAbierto(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al consultar reporte")
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setAbierto(true)}
        className="gap-2 text-xs border-primary/30 hover:bg-primary/5"
      >
        <SlidersHorizontal className="size-4 text-primary" weight="bold" />
        <span>Constructor dinámico</span>
      </Button>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Constructor Dinámico de Reportes</DialogTitle>
          </DialogHeader>
          {error && <div className="rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">{error}</div>}
          <ConstructorReporteCampos
            metrica={metrica}
            setMetrica={setMetrica}
            agruparPor={agruparPor}
            setAgruparPor={setAgruparPor}
            presetFecha={presetFecha}
            setPresetFecha={setPresetFecha}
            sucursalId={sucursalId}
            setSucursalId={setSucursalId}
            comparar={comparar}
            setComparar={setComparar}
            sucursales={sucursales}
          />
          <div className="flex justify-end gap-2 border-t pt-3">
            <Button variant="ghost" size="sm" onClick={() => setAbierto(false)}>Cancelar</Button>
            <Button size="sm" onClick={ejecutar} disabled={cargando} className="gap-1.5 text-xs">
              {cargando ? <SpinnerGap className="size-3.5 animate-spin" /> : <Play className="size-3.5" weight="fill" />}
              <span>{cargando ? "Generando..." : "Generar Reporte"}</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
