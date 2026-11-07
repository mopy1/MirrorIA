import { describe, expect, it } from "vitest"
import { ADMIN_ROUTES, STAFF_ROUTES } from "@/routes/rutas-app"
import type { SuscripcionDto } from "@/types/plan.types"
import { ADMIN_NAV_GROUPS, NAV_INICIO } from "./admin-sidebar.data"
import { esRutaActiva, grupoDeRuta, navParaRol, parsearGrupos, tituloAdmin } from "./admin-sidebar-logica"

const hrefs = (groups = ADMIN_NAV_GROUPS) => groups.flatMap((g) => g.items.map((i) => i.href))

describe("menú lateral del panel", () => {
  it("cero páginas huérfanas: toda ruta del panel (salvo subrutas) tiene link en el menú", () => {
    const enMenu = new Set([NAV_INICIO.href, ...hrefs()])
    const rutas = [...ADMIN_ROUTES, ...STAFF_ROUTES].map((r) => `/admin/${r.path}`).filter((r) => r !== "/admin/suscripcion/activar")
    expect(rutas.filter((r) => !enMenu.has(r))).toEqual([])
  })

  it("respeta los roles del router: el CAJERO no ve lo que no puede abrir y no ve grupos vacíos", () => {
    const nav = navParaRol(ADMIN_NAV_GROUPS, "CAJERO", null)
    expect(hrefs(nav).sort()).toEqual(["/admin/cobros", "/admin/mostrador", "/admin/reservas"])
    expect(nav.map((g) => g.id)).toEqual(["ventas"])
  })

  it("el ENCARGADO ve ventas, inventario y análisis, pero no cobros ni 'Mi negocio'", () => {
    const nav = navParaRol(ADMIN_NAV_GROUPS, "ENCARGADO_SUCURSAL", null)
    expect(hrefs(nav)).toContain("/admin/ml")
    expect(hrefs(nav)).not.toContain("/admin/cobros")
    expect(nav.some((g) => g.id === "negocio")).toBe(false)
  })

  it("sin rol no ofrece nada", () => {
    expect(navParaRol(ADMIN_NAV_GROUPS, undefined, null)).toEqual([])
  })

  it("el único badge es el de días de prueba, en 'Plan y suscripción'", () => {
    const trial = { estado: "TRIAL", diasRestantes: 5 } as SuscripcionDto
    const items = navParaRol(ADMIN_NAV_GROUPS, "ADMIN", trial).flatMap((g) => g.items)
    expect(items.filter((i) => i.badge).map((i) => [i.href, i.badge])).toEqual([["/admin/suscripcion", "5 días"]])
    expect(navParaRol(ADMIN_NAV_GROUPS, "ADMIN", null).flatMap((g) => g.items).some((i) => i.badge)).toBe(false)
  })

  it("ruta activa: exacta o subruta, sin falsos prefijos", () => {
    expect(esRutaActiva("/admin/suscripcion/activar", "/admin/suscripcion")).toBe(true)
    expect(esRutaActiva("/admin/ventas", "/admin/ventas")).toBe(true)
    expect(esRutaActiva("/admin/ventasx", "/admin/ventas")).toBe(false)
    expect(grupoDeRuta(ADMIN_NAV_GROUPS, "/admin/inventario")).toBe("productos")
    expect(grupoDeRuta(ADMIN_NAV_GROUPS, "/admin/dashboard")).toBeNull()
  })

  it("título de la barra superior con los nombres nuevos (gana la subruta)", () => {
    expect(tituloAdmin("/admin/dashboard")).toBe("Inicio")
    expect(tituloAdmin("/admin/cobros")).toBe("Cobros por confirmar")
    expect(tituloAdmin("/admin/cupones")).toBe("Cupones")
    expect(tituloAdmin("/admin/reportes")).toBe("Reportes con IA")
    expect(tituloAdmin("/admin/suscripcion/activar")).toBe("Activar plan")
    expect(tituloAdmin("/admin/otra")).toBe("Administración")
  })

  it("el estado guardado de los grupos tolera storage roto o manipulado", () => {
    expect(parsearGrupos(null)).toEqual({})
    expect(parsearGrupos("{roto")).toEqual({})
    expect(parsearGrupos("[1,2]")).toEqual({})
    expect(parsearGrupos('{"ventas":false,"x":"si"}')).toEqual({ ventas: false })
  })
})
