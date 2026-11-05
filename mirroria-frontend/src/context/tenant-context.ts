import { createContext } from "react"
import type { TiendaPublica } from "@/types/tienda.types"

export interface TenantContextValue {
  tienda: TiendaPublica
  slug: string
}

/** null fuera de `/t/:slug` (landing SaaS, /admin, /plataforma). */
export const TenantContext = createContext<TenantContextValue | null>(null)
