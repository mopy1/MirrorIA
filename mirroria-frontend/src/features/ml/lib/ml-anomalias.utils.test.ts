import { describe, expect, it } from "vitest"
import { humanizarAnomalia } from "./ml-anomalias.utils"
import type { ItemDiagnosticoAnomalia } from "../types/ml.types"

describe("ml-anomalias.utils", () => {
  it("retorna texto regular cuando la transacción no es anómala", () => {
    const diag: ItemDiagnosticoAnomalia = {
      venta_id: "v-001",
      monto_total_cents: 12500,
      es_anomalo: false,
      nivel_riesgo: "NORMAL",
      score_anomalia: 0.15,
    }
    const res = humanizarAnomalia(diag)
    expect(res.badges).toEqual([])
    expect(res.descripcion).toContain("regular")
  })

  it("humaniza casos combinados de descuento extremo y fuera de horario", () => {
    const diag: ItemDiagnosticoAnomalia = {
      venta_id: "v-002",
      monto_total_cents: 1500,
      descuento_cents: 48500,
      hora_venta: 3,
      es_anomalo: true,
      nivel_riesgo: "CRITICO",
      score_anomalia: -0.22,
      motivo_sospecha:
        "Descuento extremo (97%) aplicado en ticket | Emisión fuera de horario comercial",
    }
    const res = humanizarAnomalia(diag)
    expect(res.badges).toContain("Descuento excesivo (97%)")
    expect(res.badges).toContain("Fuera de horario")
    expect(res.descripcion).toBe(
      "Venta realizada fuera de horario con 97% de descuento manual aplicado en caja.",
    )
  })

  it("humaniza casos con solo descuento elevado sin porcentaje explícito", () => {
    const diag: ItemDiagnosticoAnomalia = {
      venta_id: "v-003",
      es_anomalo: true,
      nivel_riesgo: "MODERADO",
      score_anomalia: -0.08,
      motivo_sospecha: "Descuento elevado en ticket",
    }
    const res = humanizarAnomalia(diag)
    expect(res.badges).toContain("Descuento excesivo")
    expect(res.descripcion).toContain("Descuento manual inusualmente alto")
  })

  it("humaniza casos de fuera de horario exclusivo con indicación de hora", () => {
    const diag: ItemDiagnosticoAnomalia = {
      venta_id: "v-004",
      hora_venta: 4,
      es_anomalo: true,
      nivel_riesgo: "MODERADO",
      score_anomalia: -0.05,
      motivo_sospecha: "Emisión fuera de horario comercial habitual (04:00)",
    }
    const res = humanizarAnomalia(diag)
    expect(res.badges).toEqual(["Fuera de horario"])
    expect(res.descripcion).toContain("a las 04:00 hrs")
  })

  it("humaniza montos atípicos en efectivo", () => {
    const diag: ItemDiagnosticoAnomalia = {
      venta_id: "v-005",
      metodo_pago: "EFECTIVO",
      monto_total_cents: 300000,
      es_anomalo: true,
      nivel_riesgo: "CRITICO",
      score_anomalia: -0.19,
      motivo_sospecha: "Importe en efectivo atípicamente elevado",
    }
    const res = humanizarAnomalia(diag)
    expect(res.badges).toContain("Monto atípico")
    expect(res.descripcion).toContain("fuera del rango estándar de caja")
  })

  it("asigna 'Sin patrón conocido' a anomalías no catalogadas", () => {
    const diag: ItemDiagnosticoAnomalia = {
      venta_id: "v-006",
      es_anomalo: true,
      nivel_riesgo: "MODERADO",
      score_anomalia: -0.02,
      motivo_sospecha: "Desviación multidimensional detectada por Isolation Forest",
    }
    const res = humanizarAnomalia(diag)
    expect(res.badges).toEqual(["Sin patrón conocido"])
    expect(res.descripcion).toContain("Comportamiento atípico detectado")
  })
})
