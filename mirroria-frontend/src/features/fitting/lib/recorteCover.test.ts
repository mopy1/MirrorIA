import { describe, it, expect } from "vitest"
import { recorteCover } from "./recorteCover"

describe("recorteCover", () => {
  it("un video 16:9 hacia un destino 3:4 recorta a los costados, centrado", () => {
    const r = recorteCover(1920, 1080, 300, 400)
    expect(r.sh).toBe(1080)
    expect(r.sw).toBeCloseTo(810)
    expect(r.sy).toBe(0)
    expect(r.sx).toBeCloseTo((1920 - 810) / 2)
  })

  it("un video 4:3 hacia un destino 3:4 también recorta a los costados", () => {
    const r = recorteCover(640, 480, 300, 400)
    expect(r.sh).toBe(480)
    expect(r.sw).toBeCloseTo(360)
    expect(r.sy).toBe(0)
    expect(r.sx).toBeCloseTo((640 - 360) / 2)
  })

  it("cuando las proporciones ya coinciden no recorta nada", () => {
    const r = recorteCover(900, 1200, 300, 400)
    expect(r).toEqual({ sx: 0, sy: 0, sw: 900, sh: 1200 })
  })
})
