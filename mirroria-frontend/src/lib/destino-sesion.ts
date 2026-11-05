import type { UsuarioResponse } from "@/features/auth/types/auth.types"

/**
 * Adónde va alguien después de iniciar sesión (spec §7.1): plataforma →
 * `/plataforma`; staff → su ruta de `/admin` (cada rol cae en una que puede
 * abrir); clienta → el inicio de su tienda.
 */
export function destinoTrasLogin(user: Pick<UsuarioResponse, "role" | "tenant">): string {
  switch (user.role) {
    case "DUENO_PLATAFORMA":
      return "/plataforma"
    case "ADMIN":
      return "/admin"
    case "CAJERO":
      return "/admin/cobros"
    case "ENCARGADO_SUCURSAL":
      return "/admin/reportes"
    default:
      return user.tenant ? `/t/${user.tenant.slug}` : "/"
  }
}
