import { describe, it, expect } from "vitest"
import { INDICE_POSE, parDeAnclaje } from "./parDeAnclaje"

// Las aserciones van contra los NUMEROS literales (11/12/23/24), no contra
// `INDICE_POSE`: esas cuatro constantes son el unico ancla que mantiene
// alineados el web (MediaPipe) y el movil (ML Kit), y comparando contra
// ellas mismas la prueba pasaba igual aunque alguien las corrompiera.
describe("INDICE_POSE", () => {
  it("son los indices del esquema BlazePose, que el movil tambien usa", () => {
    expect(INDICE_POSE.HOMBRO_IZQ).toBe(11)
    expect(INDICE_POSE.HOMBRO_DER).toBe(12)
    expect(INDICE_POSE.CADERA_IZQ).toBe(23)
    expect(INDICE_POSE.CADERA_DER).toBe(24)
  })
})

describe("parDeAnclaje", () => {
  it("un vestido se ancla a los hombros", () => {
    expect(parDeAnclaje("vestidos")).toEqual([11, 12])
  })

  it("una blusa se ancla a los hombros", () => {
    expect(parDeAnclaje("blusas-y-tops")).toEqual([11, 12])
  })

  it("un abrigo se ancla a los hombros", () => {
    expect(parDeAnclaje("abrigos-y-blazers")).toEqual([11, 12])
  })

  it("una falda o un pantalón se anclan a las CADERAS", () => {
    // Review Focus 5: anclarlos a hombros los dejaría a la altura del pecho.
    expect(parDeAnclaje("pantalones-y-faldas")).toEqual([23, 24])
  })

  it("una categoría desconocida cae en hombros, que es lo más común", () => {
    expect(parDeAnclaje("categoria-que-no-existe")).toEqual([11, 12])
  })
})
