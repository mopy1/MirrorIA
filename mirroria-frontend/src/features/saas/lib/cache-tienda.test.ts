import { beforeEach, describe, expect, it, vi } from "vitest"
import { ApiError } from "@/lib/api"
import { resolverTiendaConCache } from "./cache-tienda"

const LUNA = { id: "t1", slug: "luna", nombre: "Luna" }

describe("ficha de la tienda sin red", () => {
  beforeEach(() => {
    const store: Record<string, string> = {}
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v },
    })
  })

  it("con red la trae y la guarda", async () => {
    await expect(resolverTiendaConCache("luna", async () => LUNA)).resolves.toEqual(LUNA)
  })

  it("sin red usa la última que se vio", async () => {
    await resolverTiendaConCache("luna", async () => LUNA)
    await expect(resolverTiendaConCache("luna", async () => { throw new TypeError("Failed to fetch") })).resolves.toEqual(LUNA)
  })

  it("una tienda que no existe no se disimula con la copia", async () => {
    await resolverTiendaConCache("luna", async () => LUNA)
    const noExiste = new ApiError(404, "no existe")
    await expect(resolverTiendaConCache("luna", async () => { throw noExiste })).rejects.toBe(noExiste)
  })

  it("sin red y sin copia, falla", async () => {
    const caida = new TypeError("Failed to fetch")
    await expect(resolverTiendaConCache("sol", async () => { throw caida })).rejects.toBe(caida)
  })
})
