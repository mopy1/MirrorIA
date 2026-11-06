import { Clock, WhatsappLogo } from "@phosphor-icons/react"
import { buttonVariants } from "@/components/ui/button"
import type { ItemEvaluacionNoShow } from "../../types/ml.types"
import { accionCita, contar, humanizarFactor, limpiarNombreClienta, vendraCita } from "../../lib/ml-lenguaje"
import { BadgeRiesgoNoShow } from "../badge-riesgo-noshow"

interface FilaCitaProps {
  item: ItemEvaluacionNoShow
  tienda: string
}

/** Una cita: hora, clienta, "¿Vendrá?", por qué y qué hacer (con WhatsApp si hay teléfono). */
export function FilaCita({ item, tienda }: FilaCitaProps) {
  const nombre = limpiarNombreClienta(item.cliente_nombre)
  const { enRiesgo } = vendraCita(item.probabilidad_no_show)
  const motivos = (item.factores_clave ?? []).map(humanizarFactor)
  const tel = item.cliente_telefono?.replace(/\D/g, "")
  const mensaje = `Hola ${nombre}, te escribimos de ${tienda} para confirmar tu cita de probador${item.hora_prevista ? ` de hoy a las ${item.hora_prevista}` : ""}. ¿Nos confirmás que venís?`
  const waUrl = tel ? `https://wa.me/${tel.length <= 8 ? `591${tel}` : tel}?text=${encodeURIComponent(mensaje)}` : null

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:gap-4">
      <span className="inline-flex w-16 shrink-0 items-center gap-1 text-sm font-semibold tabular-nums text-foreground">
        <Clock className="size-3.5 text-muted-foreground" aria-hidden />
        {item.hora_prevista ?? "Hoy"}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium text-foreground">{nombre}</span>
          {typeof item.prendas_apartadas_count === "number" && item.prendas_apartadas_count > 0 && (
            <span className="text-xs text-muted-foreground">{contar(item.prendas_apartadas_count, "prenda apartada", "prendas apartadas")}</span>
          )}
        </div>
        {motivos.length > 0 && (
          <p className="text-sm text-muted-foreground text-pretty">
            <span className="sr-only">Por qué: </span>
            {motivos.join(" · ")}
          </p>
        )}
        <p className="text-sm text-foreground/85">{accionCita(item.accion_recomendada, item.probabilidad_no_show)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
        <span className="sr-only">¿Vendrá?</span>
        <BadgeRiesgoNoShow probabilidad={item.probabilidad_no_show} />
        {waUrl && enRiesgo && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <WhatsappLogo data-icon="inline-start" weight="fill" className="text-emerald-600" aria-hidden />
            Reconfirmar
          </a>
        )}
      </div>
    </li>
  )
}
