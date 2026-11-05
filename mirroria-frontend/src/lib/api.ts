import { getTiendaActiva } from "./tienda-activa"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1"

export const TOKEN_KEY = "mirroria_token"
export const USER_KEY = "mirroria_user"

/** Evento que dispara `apiFetch` ante un 403 "tienda no disponible" (lo escucha `AdminLayout`). */
export const EVENTO_TIENDA_NO_DISPONIBLE = "mirroria:tienda-no-disponible"
const MENSAJE_NO_DISPONIBLE = "no está disponible"

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

interface BackendErrorBody {
  status: number
  message: string | string[]
  timestamp: string
}

/**
 * De dónde sale la tienda del request:
 * - `auto` (default): la tienda que se navega (`/t/:slug`) o, si no hay, la de la sesión.
 * - `sesion`: siempre la de la sesión, con su token (ej. `/auth/me` aunque se navegue otra tienda).
 * - `ninguno`: sin `X-Tenant` ni token (rutas globales 🧭: `/saas/*` públicas, ciudades,
 *   login de plataforma).
 */
export type ModoTenant = "auto" | "sesion" | "ninguno"

function slugDeSesion(): string | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? ((JSON.parse(raw) as { tenant?: { slug?: string } | null }).tenant?.slug ?? null) : null
  } catch {
    return null
  }
}

/** Cabeceras de tienda y sesión según la regla de la spec §7.3 (exportada para test). */
export function cabecerasTenant(modo: ModoTenant = "auto"): Record<string, string> {
  if (modo === "ninguno") return {}
  const token = localStorage.getItem(TOKEN_KEY)
  const deSesion = slugDeSesion()
  const activa = modo === "sesion" ? null : getTiendaActiva()
  const slug = activa ?? deSesion
  // Una sesión de otra tienda navega esta como invitada: nunca dispara el 403 "otra tienda".
  const mandarToken = token && (!activa || deSesion === activa)
  return {
    ...(slug ? { "X-Tenant": slug } : {}),
    ...(mandarToken ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/** Adónde mandar a alguien cuya sesión expiró. */
export function destinoTras401(pathname: string, slugSesion: string | null): string {
  const activa = getTiendaActiva()
  if (activa) return `/t/${activa}/login`
  if (pathname.startsWith("/plataforma")) return "/plataforma/login"
  if (slugSesion) return `/t/${slugSesion}/login`
  return "/entrar"
}

/**
 * fetch envuelto con: URL base, JSON automático, `X-Tenant` + Bearer token
 * (regla de `cabecerasTenant`) y errores con el shape único del backend
 * ({ status, message, timestamp }). Ante un 401 de un endpoint protegido
 * limpia la sesión y redirige (`destinoTras401`) — salvo en
 * `/seguridad/auth/*`, donde 401 = credenciales incorrectas.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}, modo: ModoTenant = "auto"): Promise<T> {
  const isAuthEndpoint = path.startsWith("/seguridad/auth/")

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...cabecerasTenant(modo),
      ...options.headers,
    },
  })

  if (response.status === 401 && !isAuthEndpoint) {
    const destino = destinoTras401(window.location.pathname, slugDeSesion())
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    if (window.location.pathname !== destino) window.location.href = destino
    throw new ApiError(401, "Sesión expirada")
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as BackendErrorBody | null
    const message = (Array.isArray(body?.message) ? body.message.join(", ") : body?.message) ?? "Ocurrió un error inesperado"
    if (response.status === 403 && message.includes(MENSAJE_NO_DISPONIBLE)) {
      window.dispatchEvent(new Event(EVENTO_TIENDA_NO_DISPONIBLE))
    }
    throw new ApiError(response.status, message)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
