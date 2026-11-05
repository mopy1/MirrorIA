import { describe, expect, it } from "vitest"
import { destinoTrasLogin } from "./destino-sesion"

const tenant = { id: "t1", slug: "lila", nombre: "Lila" }

describe("destinoTrasLogin", () => {
  it("lleva a cada rol a una ruta que puede abrir", () => {
    expect(destinoTrasLogin({ role: "DUENO_PLATAFORMA", tenant: null })).toBe("/plataforma")
    expect(destinoTrasLogin({ role: "ADMIN", tenant })).toBe("/admin")
    expect(destinoTrasLogin({ role: "CAJERO", tenant })).toBe("/admin/cobros")
    expect(destinoTrasLogin({ role: "ENCARGADO_SUCURSAL", tenant })).toBe("/admin/reportes")
    expect(destinoTrasLogin({ role: "CUSTOMER", tenant })).toBe("/t/lila")
  })
})
