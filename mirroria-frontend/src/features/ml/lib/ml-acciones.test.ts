import { describe, expect, it } from "vitest"
import { armarAccionesSemana, fraseSemana, type DatosPredicciones } from "./ml-acciones"
import { armarKpis } from "./ml-kpis"

const datos: DatosPredicciones = {
  demanda: {
    horizonte_dias: 30,
    total_items_evaluados: 3,
    kpis_resumen: { quiebre_stock_rate_pct: 66, rotacion_proyectada: 1.2 },
    predicciones: [
      { producto_id: "p1", demanda_proyectada_unidades: 15, stock_actual: 4, reabastecimiento_sugerido: 14, riesgo_quiebre: "ALTO", dias_de_stock_estimados: 8 },
      { producto_id: "p2", demanda_proyectada_unidades: 12, stock_actual: 0, reabastecimiento_sugerido: 15, riesgo_quiebre: "CRITICO", dias_de_stock_estimados: 0 },
      { producto_id: "p3", demanda_proyectada_unidades: 2, stock_actual: 30, reabastecimiento_sugerido: 0, riesgo_quiebre: "BAJO", dias_de_stock_estimados: 400 },
    ],
  },
  noShow: {
    tasa_no_show_esperada_pct: 40,
    alertas_criticas_count: 1,
    evaluaciones: [
      { reserva_id: "r1", probabilidad_no_show: 0.74, clasificacion: "ALTO_RIESGO", color_semaforo: "ROJO", accion_recomendada: "CONFIRMAR_WHATSAPP_PRIORITARIO", factores_clave: [] },
      { reserva_id: "r2", probabilidad_no_show: 0.18, clasificacion: "BAJO_RIESGO", color_semaforo: "VERDE", accion_recomendada: "ASISTIRA_NORMAL", factores_clave: [] },
    ],
  },
  rfm: {
    total_clientas: 4, distribucion_clusters: { EN_RIESGO_DORMIDAS: 1, VIPS_LEALES: 3 },
    clientas_clasificadas: [], tasa_retencion_estimada_pct: 70, clv_promedio_bs: 900,
  },
  anomalias: {
    total_analizadas: 3, anomalias_detectadas: 1, tasa_anomalias_pct: 33, monto_sospechoso_cents: 1500,
    diagnosticos: [{ venta_id: "v1", score_anomalia: -0.2, es_anomalo: true, nivel_riesgo: "CRITICO" }],
  },
  nombres: { p1: "Blusa de Lino", p2: "Vestido Floral" },
}

describe("armarAccionesSemana", () => {
  it("prioriza y redacta cada acción con verbo + cantidad + pestaña destino", () => {
    const acciones = armarAccionesSemana(datos)
    expect(acciones.map((a) => a.id)).toEqual(["reponer", "citas", "ventas", "clientas"])
    expect(acciones[0]).toMatchObject({ tab: "demanda", titulo: "Reponer 2 prendas antes de que se agoten", tono: "critico" })
    expect(acciones[0].detalle).toContain("Vestido Floral, Blusa de Lino")
    expect(acciones[0].detalle).toContain("29 unidades")
    expect(acciones[1].titulo).toBe("Confirmar 1 cita con riesgo de no venir")
    expect(acciones[2].titulo).toBe("Revisar 1 venta inusual")
    expect(acciones[3].titulo).toBe("Recuperar 1 clienta que dejó de comprar")
  })

  it("devuelve lista vacía y una frase tranquila cuando no hay nada que hacer", () => {
    const acciones = armarAccionesSemana({})
    expect(acciones).toEqual([])
    expect(fraseSemana(acciones)).toContain("Todo en orden")
  })

  it("resume la semana empezando por lo más urgente", () => {
    expect(fraseSemana(armarAccionesSemana(datos))).toBe(
      "Esta semana hay 4 cosas que atender. Lo más urgente: reponer 2 prendas antes de que se agoten.",
    )
  })
})

describe("armarKpis", () => {
  it("expresa los 4 números en lenguaje de negocio, con comparación explícita", () => {
    const kpis = armarKpis(datos)
    expect(kpis.map((k) => k.titulo)).toEqual([
      "Prendas que se pueden agotar", "Citas que pueden fallar", "Clientas que siguen comprando", "Ventas inusuales",
    ])
    expect(kpis.map((k) => k.valor)).toEqual(["2", "1", "3", "1"])
    expect(kpis[0].detalle).toBe("de 3 prendas, en los próximos 30 días")
    expect(kpis[2].detalle).toBe("de 4 clientas con compras")
  })

  it("muestra un guion cuando un dato no llegó", () => {
    expect(armarKpis({}).every((k) => k.valor === "—")).toBe(true)
  })
})
