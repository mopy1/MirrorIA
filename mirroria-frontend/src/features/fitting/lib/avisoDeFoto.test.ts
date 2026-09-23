import { describe, it, expect } from "vitest"
import {
  AVISO_FOTO_CAMARA_NO_LISTA,
  AVISO_FOTO_FALLIDA,
  AVISO_FOTO_SIN_PRENDA,
  avisoDespuesDeLaFoto,
} from "./avisoDeFoto"

describe("avisoDespuesDeLaFoto", () => {
  it("si la foto falla, lo dice en vez de no hacer nada", () => {
    expect(avisoDespuesDeLaFoto(null, "fallo")).toBe(AVISO_FOTO_FALLIDA)
  })

  it("si la foto salió sin la prenda, lo dice", () => {
    expect(avisoDespuesDeLaFoto(null, "sin-prenda")).toBe(AVISO_FOTO_SIN_PRENDA)
  })

  it("si la cámara todavía no arrancó, lo dice", () => {
    expect(avisoDespuesDeLaFoto(null, "camara-no-lista")).toBe(AVISO_FOTO_CAMARA_NO_LISTA)
  })

  it("una foto que sale bien no deja ningún aviso", () => {
    expect(avisoDespuesDeLaFoto(null, "ok")).toBeNull()
  })

  it("una foto que sale bien limpia el aviso de la foto anterior", () => {
    expect(avisoDespuesDeLaFoto(AVISO_FOTO_FALLIDA, "ok")).toBeNull()
    expect(avisoDespuesDeLaFoto(AVISO_FOTO_SIN_PRENDA, "ok")).toBeNull()
    expect(avisoDespuesDeLaFoto(AVISO_FOTO_CAMARA_NO_LISTA, "ok")).toBeNull()
  })

  it("pero NO borra el aviso de que la prenda no cargó", () => {
    // Ese aviso explica por qué la clienta no tiene nada puesto: sacar una
    // foto no es motivo para hacerlo desaparecer.
    const otro = "Esa prenda no se pudo cargar. Probá con otra."
    expect(avisoDespuesDeLaFoto(otro, "ok")).toBe(otro)
  })
})
