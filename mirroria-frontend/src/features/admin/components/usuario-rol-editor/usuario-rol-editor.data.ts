import {
  IdentificationBadge,
  ShieldCheck,
  Storefront,
  User,
  type Icon,
} from "@phosphor-icons/react"

export interface RolConfigItem {
  label: string
  description: string
  badgeClasses: string
  icon: Icon
}

export const ROLES_CONFIG: Record<string, RolConfigItem> = {
  ADMIN: {
    label: "Administrador",
    description: "Acceso total a configuración, catálogo, ventas y reportes",
    badgeClasses: "border-primary/30 bg-primary/10 text-primary font-medium",
    icon: ShieldCheck,
  },
  ENCARGADO_SUCURSAL: {
    label: "Encargado de Sucursal",
    description: "Gestiona inventario, reservas y personal de su sucursal",
    badgeClasses: "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-medium",
    icon: Storefront,
  },
  CAJERO: {
    label: "Cajero",
    description: "Opera el punto de venta (POS) y cobros de sucursal",
    badgeClasses: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium",
    icon: IdentificationBadge,
  },
  CUSTOMER: {
    label: "Cliente",
    description: "Usuario estándar con acceso a compras online y reservas",
    badgeClasses: "border-muted-foreground/20 bg-muted/60 text-muted-foreground font-normal",
    icon: User,
  },
}

export const ROLES_CON_SUCURSAL = ["ENCARGADO_SUCURSAL", "CAJERO"]

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
