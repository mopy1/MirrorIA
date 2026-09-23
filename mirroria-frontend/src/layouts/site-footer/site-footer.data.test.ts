import { describe, it, expect } from "vitest"
import { FOOTER_COLUMNS } from "./site-footer.data"

const enlaces = FOOTER_COLUMNS.flatMap((c) => c.links)
const buscar = (label: string) => enlaces.find((l) => l.label === label)

describe("enlaces del pie", () => {
  it("«Reservas» lleva a la página de reservas, que existe en App.tsx", () => {
    // Estaba en "#": el usuario hacia clic, la pagina saltaba al tope y no
    // pasaba nada, aunque /reservas es una ruta real (protegida: sin sesion
    // ProtectedRoute manda a /login, que es el comportamiento correcto).
    expect(buscar("Reservas")?.href).toBe("/reservas")
  })
})
