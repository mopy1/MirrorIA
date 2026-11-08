import { describe, expect, it } from "vitest"
import {
  accionCita,
  contar,
  estadoStock,
  humanizarFactor,
  limpiarNombreClienta,
  metodoPagoHumano,
  vendraCita,
} from "./ml-lenguaje"
import { armarGruposClientas } from "./ml-clientas"
import type { RfmSegmentosResponse } from "../types/ml.types"

describe("ml-lenguaje", () => {
  it("pluraliza", () => {
    expect(contar(1, "cita", "citas")).toBe("1 cita")
    expect(contar(3, "cita", "citas")).toBe("3 citas")
  })

  it("dice el riesgo de stock en palabras", () => {
    expect(estadoStock("BAJO").etiqueta).toBe("Sin riesgo")
    expect(estadoStock("MEDIO").etiqueta).toBe("Atento")
    expect(estadoStock("ALTO").etiqueta).toBe("Se agota pronto")
    expect(estadoStock("CRITICO").etiqueta).toBe("Se agota ya")
  })

  it("responde '¿Vendrá?' con los cortes del servicio, en 0-1 o 0-100", () => {
    expect(vendraCita(0.18).etiqueta).toBe("Seguro")
    expect(vendraCita(0.42).etiqueta).toBe("Puede faltar")
    expect(vendraCita(0.74).etiqueta).toBe("Probable que falte")
    expect(vendraCita(74).etiqueta).toBe("Probable que falte")
    expect(vendraCita(0.2).enRiesgo).toBe(false)
  })

  it("traduce factores del modelo y quita los pesos en porcentaje", () => {
    expect(humanizarFactor("Reserva realizada con 10 días de anticipación (+28%)")).toBe("Reservó con 10 días de anticipación")
    expect(humanizarFactor("Clienta sin historial previo de reservas (+15%)")).toBe("Es su primera reserva")
    expect(humanizarFactor("Alto número de prendas solicitadas (5 prendas)")).toBe("Apartó 5 prendas")
    expect(humanizarFactor("Algo nuevo (+3%)")).toBe("Algo nuevo")
  })

  it("convierte la acción sugerida en una instrucción", () => {
    expect(accionCita("CONFIRMAR_WHATSAPP_PRIORITARIO", 0.8)).toContain("WhatsApp")
    expect(accionCita("ASISTIRA_NORMAL", 0.1)).toBe("No hace falta hacer nada")
    expect(accionCita("DESCONOCIDA", 0.5)).toBe("Si no llega a la hora, llamala")
  })

  it("humaniza método de pago y nombres de clientas", () => {
    expect(metodoPagoHumano("WAYRA_QR")).toBe("QR")
    expect(metodoPagoHumano("EFECTIVO")).toBe("Efectivo")
    expect(limpiarNombreClienta("María Suárez (VIP)")).toBe("María Suárez")
  })
})

describe("armarGruposClientas", () => {
  it("arma los 4 grupos con nombres humanos, peso y valor por clienta", () => {
    const rfm: RfmSegmentosResponse = {
      total_clientas: 4,
      distribucion_clusters: { VIPS_LEALES: 1, EN_RIESGO_DORMIDAS: 3 },
      clientas_clasificadas: [
        { clienta_id: "1", cliente_nombre: "Ana (VIP)", recency_dias: 5, frequency_compras: 8, monetary_cents: 1, cluster_id: 0, segmento: "VIPS_LEALES", clv_estimado_bs: 4000, estrategia_sugerida: "Preventa exclusiva" },
      ],
      tasa_retencion_estimada_pct: 50,
      clv_promedio_bs: 1000,
    }
    const grupos = armarGruposClientas(rfm)
    expect(grupos.map((g) => g.nombre)).toEqual(["Fieles", "Nuevas con potencial", "Dejaron de comprar", "Compran en ofertas"])
    expect(grupos[0]).toMatchObject({ cantidad: 1, porcentaje: 25, valorPorClientaBs: 4000, nombres: ["Ana"], queHacer: "Preventa exclusiva" })
    expect(grupos[2]).toMatchObject({ cantidad: 3, porcentaje: 75, valorPorClientaBs: null })
  })
})
