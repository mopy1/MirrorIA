import { describe, expect, it } from "vitest"
import { estadoCita, linkReconfirmar, pasoLaHora, pronosticoAsistencia } from "./citas-hoy"
import { describirRango, fechaCorta, fechaLarga, periodoDeComparacion } from "./fechas-dashboard"
import { agruparPagosPorMetodo, nombreMetodoPago } from "./metodos-pago"
import { describirVariacion } from "./variacion"

describe("describirVariacion", () => {
  it("sube y baja en palabras, sin signos", () => {
    expect(describirVariacion(120, 100, 20).texto).toBe("20% más que el período anterior")
    expect(describirVariacion(80, 100, -20)).toMatchObject({ direccion: "baja", tono: "mal", texto: "20% menos que el período anterior" })
  })
  it("nunca muestra +100% cuando el anterior fue 0", () => {
    expect(describirVariacion(500, 0, 100)).toMatchObject({ direccion: "sin_anterior", texto: "Sin ventas en el período anterior" })
    expect(describirVariacion(3, 0, 100, { textoSinAnterior: "Nadie compró antes" }).texto).toBe("Nadie compró antes")
  })
  it("distingue igual de sin datos", () => {
    expect(describirVariacion(100, 100, 0).direccion).toBe("igual")
    expect(describirVariacion(0, 0, 0).direccion).toBe("sin_datos")
  })
})

describe("fechas", () => {
  it("formatea corto y largo en español", () => {
    expect(fechaCorta("2026-11-06")).toBe("6 nov")
    expect(fechaLarga("2026-11-06")).toBe("viernes 6 de noviembre")
  })
  it("describe el rango y contra qué se compara", () => {
    const periodo = { clave: "30d", desde: "2026-10-07T04:00:00.000Z", hasta: "2026-11-07T03:59:59.999Z", sucursalId: null, sucursalNombre: "" }
    expect(describirRango(periodo)).toBe("Del 7 oct al 6 nov · comparado con los 30 días anteriores")
    expect(periodoDeComparacion("hoy")).toBe("ayer")
  })
})

describe("metodos de pago", () => {
  it("traduce códigos técnicos a nombres humanos", () => {
    expect(nombreMetodoPago("EFECTIVO", "MANUAL")).toBe("Efectivo")
    expect(nombreMetodoPago("", "STRIPE")).toBe("Tarjeta")
    expect(nombreMetodoPago("QR", "WAYRA")).toBe("QR")
  })
  it("agrupa por método, recalcula porcentajes y mantiene orden y color fijos", () => {
    const grupos = agruparPagosPorMetodo([
      { proveedor: "WAYRA", metodo: "QR", montoBs: 250, porcentaje: 25, transacciones: 1 },
      { proveedor: "MANUAL", metodo: "EFECTIVO", montoBs: 750, porcentaje: 75, transacciones: 3 },
    ])
    expect(grupos.map((g) => [g.nombre, g.porcentaje])).toEqual([["Efectivo", 75], ["QR", 25]])
    expect(grupos[0].color).toBe("#2a78d6")
  })
})

describe("citas de hoy", () => {
  const a_las = (h: number, m = 0) => new Date(2026, 10, 6, h, m)
  it("pone estados humanos", () => {
    expect(estadoCita("EN_TIENDA", "10:00", a_las(9)).etiqueta).toBe("Ya llegó")
    expect(estadoCita("EXPIRADA", "10:00", a_las(9)).etiqueta).toBe("No vino")
    expect(estadoCita("PENDIENTE", "10:00", a_las(9)).etiqueta).toBe("Pendiente")
  })
  it("marca 'Pasó la hora' después de 15 minutos de tolerancia", () => {
    expect(pasoLaHora("CONFIRMADA", "10:00", a_las(10, 10))).toBe(false)
    expect(estadoCita("CONFIRMADA", "10:00", a_las(10, 20)).etiqueta).toBe("Pasó la hora")
    expect(pasoLaHora("EN_TIENDA", "10:00", a_las(12))).toBe(false)
  })
  it("traduce la probabilidad de faltar a '¿Vendrá?'", () => {
    expect(pronosticoAsistencia("PENDIENTE", 0.1)?.etiqueta).toBe("Seguro")
    expect(pronosticoAsistencia("PENDIENTE", 45)?.etiqueta).toBe("Puede faltar")
    expect(pronosticoAsistencia("CONFIRMADA", 0.8)?.etiqueta).toBe("Probable que falte")
    expect(pronosticoAsistencia("PENDIENTE", undefined)).toBeNull()
    expect(pronosticoAsistencia("EN_TIENDA", 0.9)).toBeNull()
  })
  it("arma el link de WhatsApp con +591", () => {
    expect(linkReconfirmar("Ana", "7123-4567", "10:00")).toMatch(/^https:\/\/wa\.me\/59171234567\?text=/)
    expect(linkReconfirmar("Ana", null, "10:00")).toBeNull()
  })
})
