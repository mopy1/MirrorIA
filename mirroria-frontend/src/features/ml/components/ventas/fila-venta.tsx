import { formatMoney } from "@/lib/money"
import type { ItemDiagnosticoAnomalia } from "../../types/ml.types"
import { humanizarAnomalia } from "../../lib/ml-anomalias.utils"
import { formatearHora, metodoPagoHumano } from "../../lib/ml-lenguaje"
import { formatearNombreVenta } from "../../lib/ml.utils"
import { EstadoPill } from "../comun/estado-pill"

/** Una venta reciente: Normal o "Inusual, revisar", con el motivo en palabras, monto y hora. */
export function FilaVenta({ venta }: { venta: ItemDiagnosticoAnomalia }) {
  const { inusual, estado, motivos } = humanizarAnomalia(venta)
  const hora = formatearHora(venta.hora_venta)
  const titulo = formatearNombreVenta(venta.venta_id) ?? (hora ? `Venta de las ${hora}` : "Venta")
  const datos = [hora && !titulo.includes(hora) ? hora : null, metodoPagoHumano(venta.metodo_pago)].filter(Boolean)

  return (
    <li className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm">
          <span className="font-medium text-foreground">{titulo}</span>
          {typeof venta.monto_total_cents === "number" && (
            <span className="tabular-nums text-foreground/85"> · {formatMoney(venta.monto_total_cents)}</span>
          )}
          {datos.length > 0 && <span className="text-muted-foreground"> · {datos.join(" · ")}</span>}
        </p>
        {inusual && <p className="text-sm text-muted-foreground text-pretty">{motivos.join(" · ")}</p>}
      </div>
      <EstadoPill tono={inusual ? (venta.nivel_riesgo === "CRITICO" ? "critico" : "alerta") : "bien"} className="self-start">
        {estado}
      </EstadoPill>
    </li>
  )
}
