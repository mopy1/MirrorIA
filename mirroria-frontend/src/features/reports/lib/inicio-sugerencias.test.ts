import { describe, expect, it } from "vitest"
import { agruparPorTema, SUGERENCIAS, sugerenciasDestacadas, TEMAS } from "./inicio-sugerencias"

describe("agruparPorTema", () => {
  it("respeta el orden de TEMAS y pone cada pregunta en su grupo", () => {
    const grupos = agruparPorTema()
    expect(grupos.map((g) => g.tema)).toEqual(TEMAS.map((t) => t.id))
    expect(grupos.flatMap((g) => g.preguntas)).toHaveLength(SUGERENCIAS.length)
  })

  it("omite temas sin preguntas y no repite preguntas", () => {
    const grupos = agruparPorTema([
      { tema: "reservas", texto: "Reservas por estado" },
      { tema: "reservas", texto: "Reservas por estado" },
      { tema: "ventas", texto: "Ventas por mes" },
    ])
    expect(grupos).toEqual([
      { tema: "ventas", nombre: "Ventas", preguntas: ["Ventas por mes"] },
      { tema: "reservas", nombre: "Reservas", preguntas: ["Reservas por estado"] },
    ])
  })
})

describe("sugerenciasDestacadas", () => {
  it("devuelve la primera pregunta de cada tema (4 para el chat vacío)", () => {
    const destacadas = sugerenciasDestacadas()
    expect(destacadas).toHaveLength(4)
    expect(new Set(destacadas.map((s) => s.tema)).size).toBe(4)
    expect(destacadas[0].texto).toBe(SUGERENCIAS.find((s) => s.tema === "ventas")!.texto)
  })
})
