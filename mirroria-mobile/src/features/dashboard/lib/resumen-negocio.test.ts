import { describe, expect, it } from "vitest"
import type { DashboardEjecutivoDto } from "../types/dashboard.types"
import { armarAvisosNegocio, armarResumenNegocio, contarCompras } from "./resumen-negocio"

function crearData(over: { ingresos?: number; anteriorCents?: number; variacion?: number } = {}): DashboardEjecutivoDto {
  const ingresos = over.ingresos ?? 7120
  return {
    periodo: { clave: "30d", desde: "2026-10-07T04:00:00.000Z", hasta: "2026-11-07T03:59:59.999Z", sucursalId: null, sucursalNombre: "Todas" },
    kpis: {
      ingresos: { montoCents: ingresos * 100, montoBs: ingresos, anteriorMontoCents: over.anteriorCents ?? 600000, variacionPorcentaje: over.variacion ?? 18.67, tendencia: "POSITIVA" },
      ticketPromedio: { montoCents: 142400, montoBs: 1424, anteriorMontoCents: 0, variacionPorcentaje: 0, tendencia: "NEUTRA" },
      rotacionInventario: { ratio: 0.1, unidadesVendidas: 33, stockTotalDisponible: 330, interpretacion: "LENTA" },
      conversionReservas: { tasaPorcentaje: 0, reservasConVenta: 0, totalReservasCerradas: 1, variacionPorcentaje: 0 },
      clientesActivos: { cantidad: 4, anteriorCantidad: 2, variacionPorcentaje: 100 },
    },
    graficos: {
      tendenciaIngresos: [
        { fecha: "2026-11-05", ingresosBs: ingresos > 0 ? 6270 : 0, ventas: ingresos > 0 ? 3 : 0 },
        { fecha: "2026-11-06", ingresosBs: ingresos > 0 ? 850 : 0, ventas: ingresos > 0 ? 2 : 0 },
      ],
      distribucionPagos: [
        { proveedor: "MANUAL", metodo: "EFECTIVO", montoBs: 5000, porcentaje: 70.2, transacciones: 3 },
        { proveedor: "STRIPE", metodo: "TARJETA", montoBs: 2120, porcentaje: 29.8, transacciones: 2 },
      ],
      topPrendas: [{ productoId: "p1", nombre: "Vestido Floral de Seda", categoria: "Vestidos", imagenUrl: null, unidadesVendidas: 4, ingresosBs: 3200 }],
      topProveedores: [],
    },
    planSaaS: {
      planNombre: "Crecimiento",
      nivelMarca: "COMPLETA",
      diasRestantes: 20,
      limites: {
        productos: { actual: 9, maximo: 10, porcentaje: 90 },
        sucursales: { actual: 1, maximo: 3, porcentaje: 33 },
        usuariosStaff: { actual: 2, maximo: null, porcentaje: null },
      },
    },
  }
}

describe("armarResumenNegocio", () => {
  it("arma la frase con monto, compras, variación, prenda estrella y método dominante", () => {
    const frase = armarResumenNegocio(crearData())
    expect(frase).toBe(
      "En los últimos 30 días vendiste Bs 7.120 en 5 compras. Es 19% más que en los 30 días anteriores. " +
        "Lo que más salió fue Vestido Floral de Seda (4 unidades) y la mayoría te pagó con efectivo.",
    )
  })

  it("no inventa un porcentaje cuando el período anterior fue 0", () => {
    const frase = armarResumenNegocio(crearData({ anteriorCents: 0, variacion: 100 }))
    expect(frase).toContain("En los 30 días anteriores no hubo ventas")
    expect(frase).not.toContain("%")
  })

  it("habla de bajas en palabras", () => {
    expect(armarResumenNegocio(crearData({ variacion: -25 }))).toContain("Es 25% menos que en los 30 días anteriores.")
  })

  it("explica qué va a aparecer cuando no hay ventas", () => {
    const frase = armarResumenNegocio(crearData({ ingresos: 0 }))
    expect(frase).toMatch(/^En los últimos 30 días todavía no hay ventas registradas/)
  })

  it("cuenta compras sumando la serie diaria", () => {
    expect(contarCompras(crearData())).toBe(5)
  })
})

describe("armarAvisosNegocio", () => {
  it("avisa stock lento, reservas sin compra y límite de plan, con su destino", () => {
    const avisos = armarAvisosNegocio(crearData())
    expect(avisos.map((a) => a.href)).toEqual(["/admin/inventario", "/admin/reservas", "/admin/suscripcion"])
    expect(avisos[0].texto).toContain("salieron 33 de 330 prendas")
    expect(avisos[1].texto).toContain("De 1 reserva, ninguna terminó en compra")
    expect(avisos[2].texto).toBe("Ya usás 9 de 10 prendas que permite tu plan.")
  })

  it("devuelve un aviso tranquilizador si no hay nada que mirar", () => {
    const data = crearData()
    data.kpis.rotacionInventario.interpretacion = "SALUDABLE"
    data.kpis.conversionReservas = { tasaPorcentaje: 100, reservasConVenta: 2, totalReservasCerradas: 2, variacionPorcentaje: 0 }
    data.planSaaS.limites.productos = { actual: 9, maximo: null, porcentaje: null }
    const avisos = armarAvisosNegocio(data)
    expect(avisos).toHaveLength(1)
    expect(avisos[0].tono).toBe("bien")
    expect(avisos[0].href).toBeUndefined()
  })
})
