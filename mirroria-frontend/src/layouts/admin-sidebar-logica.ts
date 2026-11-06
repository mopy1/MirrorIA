import type { UsuarioRole } from "@/features/auth/types/auth.types"
import type { SuscripcionDto } from "@/types/plan.types"
import { ADMIN_TITLES, type NavGroup, type NavItem } from "./admin-sidebar.data"

/** Lógica pura del menú lateral (sin React), para poder testearla en node. */

export const puedeVer = (item: NavItem, role: UsuarioRole | undefined): boolean =>
  !!role && (item.roles ?? ["ADMIN"]).includes(role)

/** Filtra por rol (grupos vacíos fuera) y agrega el único badge con información: días de prueba. */
export function navParaRol(groups: NavGroup[], role: UsuarioRole | undefined, suscripcion: SuscripcionDto | null): NavGroup[] {
  return groups
    .map((g) => ({
      ...g,
      items: g.items
        .filter((item) => puedeVer(item, role))
        .map((item) =>
          item.href === "/admin/suscripcion" && suscripcion?.estado === "TRIAL"
            ? { ...item, badge: `${suscripcion.diasRestantes} ${suscripcion.diasRestantes === 1 ? "día" : "días"}` }
            : item,
        ),
    }))
    .filter((g) => g.items.length > 0)
}

/** Activo si es la ruta exacta o una subruta (`/admin/suscripcion/activar` activa "Plan y suscripción"). */
export const esRutaActiva = (pathname: string, href: string): boolean => pathname === href || pathname.startsWith(`${href}/`)

export const grupoDeRuta = (groups: NavGroup[], pathname: string): string | null =>
  groups.find((g) => g.items.some((i) => esRutaActiva(pathname, i.href)))?.id ?? null

/** Título de la barra superior: gana el prefijo más largo. */
export function tituloAdmin(pathname: string): string {
  const match = Object.keys(ADMIN_TITLES)
    .filter((href) => esRutaActiva(pathname, href))
    .sort((a, b) => b.length - a.length)[0]
  return match ? ADMIN_TITLES[match] : "Administración"
}

/** Acepta solo `{ [id]: boolean }`; cualquier otra cosa (JSON roto, storage manipulado) = sin preferencias. */
export function parsearGrupos(raw: string | null): Record<string, boolean> {
  if (!raw) return {}
  try {
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== "object" || Array.isArray(data)) return {}
    return Object.fromEntries(Object.entries(data).filter(([, v]) => typeof v === "boolean")) as Record<string, boolean>
  } catch {
    return {}
  }
}

/** localStorage puede no existir o tirar (modo privado, cookies bloqueadas): el menú funciona igual. */
export function leerStorage(clave: string): string | null {
  try {
    return window.localStorage.getItem(clave)
  } catch {
    return null
  }
}

export function escribirStorage(clave: string, valor: string): void {
  try {
    window.localStorage.setItem(clave, valor)
  } catch {
    /* sin persistencia: no es un error para la persona */
  }
}
