import { describe, expect, it } from "vitest"
import { humanizarAnomalia } from "./ml-anomalias.utils"
import type { ItemDiagnosticoAnomalia } from "../types/ml.types"

const base: ItemDiagnosticoAnomalia = {
  venta_id: "v-1",
  es_anomalo: true,
  nivel_riesgo: "MODERADO",
  score_anomalia: -0.05,
}

describe("humanizarAnomalia", () => {
  it("marca como Normal una venta regular, sin motivos", () => {
    const res = humanizarAnomalia({ ...base, es_anomalo: false, nivel_riesgo: "NORMAL", score_anomalia: 0.15 })
    expect(res).toEqual({ inusual: false, estado: "Normal", motivos: [] })
  })

  it("traduce descuento extremo y fuera de horario a palabras", () => {
    const res = humanizarAnomalia({
      ...base,
      nivel_riesgo: "CRITICO",
      hora_venta: 3,
      motivo_sospecha: "Descuento extremo (97%) aplicado en ticket | Emisión fuera de horario comercial habitual (03:00)",
    })
    expect(res.estado).toBe("Inusual, revisar")
    expect(res.motivos).toEqual(["97% de descuento", "Fuera de horario (03:00)"])
  })

  it("calcula el porcentaje de descuento con los montos cuando el texto no lo trae", () => {
    const res = humanizarAnomalia({
      ...base,
      monto_total_cents: 1500,
      descuento_cents: 48500,
      motivo_sospecha: "Descuento elevado o transacción fuera de horario comercial",
    })
    expect(res.motivos[0]).toBe("97% de descuento")
  })

  it("traduce montos atípicos", () => {
    expect(
      humanizarAnomalia({ ...base, motivo_sospecha: "Monto total insignificante (Bs 12.00) para 7 prendas" }).motivos,
    ).toEqual(["Monto muy bajo para 7 prendas"])
    expect(
      humanizarAnomalia({ ...base, metodo_pago: "EFECTIVO", monto_total_cents: 300000, motivo_sospecha: "Importe en efectivo atípicamente elevado" }).motivos,
    ).toEqual(["Mucho dinero en efectivo"])
  })

  it("no expone el nombre del algoritmo cuando no hay patrón conocido", () => {
    const res = humanizarAnomalia({ ...base, motivo_sospecha: "Desviación multidimensional detectada por Isolation Forest" })
    expect(res.motivos).toEqual(["No se parece a tus ventas de siempre"])
  })
})
