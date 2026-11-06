import { Check, CircleNotch, WhatsappLogo } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { estadoCita, estaPorLlegar, linkReconfirmar, pronosticoAsistencia } from "../../lib/citas-hoy"
import type { ReservaHoyItemDto } from "../../types/dashboard.types"
import { EtiquetaTono } from "../shared/etiqueta-tono"
import { cn } from "cn"

interface CitaFilaProps {
  cita: ReservaHoyItemDto
  ahora: Date
  marcando: boolean
  error?: string
  onMarcarLlegada: (id: string) => void
}

/** Una cita en la línea de tiempo: hora, clienta, prendas, estado, "¿Vendrá?" y acciones. */
export function CitaFila({ cita, ahora, marcando, error, onMarcarLlegada }: CitaFilaProps) {
  const estado = estadoCita(cita.estado, cita.horaPrevista, ahora)
  const vendra = pronosticoAsistencia(cita.estado, cita.probabilidadNoShow)
  const porLlegar = estaPorLlegar(cita.estado)
  const whatsapp = porLlegar ? linkReconfirmar(cita.cliente.nombre, cita.cliente.telefono, cita.horaPrevista) : null
  const sugerirReconfirmar = vendra?.tono === "mal" || vendra?.tono === "atencion" || estado.etiqueta === "Pasó la hora"

  return (
    <li className="group grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-3">
      <span className="pt-0.5 text-sm font-semibold text-foreground tabular-nums">{cita.horaPrevista}</span>
      <div className="relative min-w-0 border-l border-border pb-5 pl-4 group-last:pb-1">
        <span className={cn("absolute top-1.5 -left-[5px] size-[9px] rounded-full ring-2 ring-card", porLlegar ? "bg-primary" : "bg-muted-foreground/40")} aria-hidden />
        <p className="text-sm font-medium text-foreground break-words">{cita.cliente.nombre}</p>
        {cita.prendas.length > 0 && (
          <p className="mt-0.5 text-xs text-muted-foreground text-pretty">
            Apartó: {cita.prendas.map((p) => `${p.nombre} (talla ${p.talla}, ${p.color})`).join(" · ")}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <EtiquetaTono tono={estado.tono}>{estado.etiqueta}</EtiquetaTono>
          {vendra && <EtiquetaTono tono={vendra.tono}>¿Vendrá? {vendra.etiqueta}</EtiquetaTono>}
        </div>
        {porLlegar && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={marcando} onClick={() => onMarcarLlegada(cita.reservaId)} className="gap-1.5">
              {marcando ? <CircleNotch className="animate-spin" /> : <Check weight="bold" />}
              Ya llegó
            </Button>
            {whatsapp && (
              <Button
                size="sm"
                variant={sugerirReconfirmar ? "secondary" : "ghost"}
                className="gap-1.5"
                render={<a href={whatsapp} target="_blank" rel="noopener noreferrer" />}
                nativeButton={false}
              >
                <WhatsappLogo weight="fill" />
                Reconfirmar por WhatsApp
              </Button>
            )}
          </div>
        )}
        {error && <p role="alert" className="mt-2 text-xs text-rose-700">{error}</p>}
      </div>
    </li>
  )
}
