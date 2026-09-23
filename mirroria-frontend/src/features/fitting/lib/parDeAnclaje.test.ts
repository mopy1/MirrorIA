import { describe, it, expect } from "vitest"
import { INDICE_POSE, parDeAnclaje } from "./parDeAnclaje"

describe("parDeAnclaje", () => {
  it("un vestido se ancla a los hombros", () => {
    expect(parDeAnclaje("vestidos")).toEqual([INDICE_POSE.HOMBRO_IZQ, INDICE_POSE.HOMBRO_DER])
  })

  it("una blusa se ancla a los hombros", () => {
    expect(parDeAnclaje("blusas-y-tops")).toEqual([INDICE_POSE.HOMBRO_IZQ, INDICE_POSE.HOMBRO_DER])
  })

  it("un abrigo se ancla a los hombros", () => {
    expect(parDeAnclaje("abrigos-y-blazers")).toEqual([INDICE_POSE.HOMBRO_IZQ, INDICE_POSE.HOMBRO_DER])
  })

  it("una falda o un pantalón se anclan a las CADERAS", () => {
    // Review Focus 5: anclarlos a hombros los dejaría a la altura del pecho.
    expect(parDeAnclaje("pantalones-y-faldas")).toEqual([INDICE_POSE.CADERA_IZQ, INDICE_POSE.CADERA_DER])
  })

  it("una categoría desconocida cae en hombros, que es lo más común", () => {
    expect(parDeAnclaje("categoria-que-no-existe")).toEqual([
      INDICE_POSE.HOMBRO_IZQ,
      INDICE_POSE.HOMBRO_DER,
    ])
  })
})
