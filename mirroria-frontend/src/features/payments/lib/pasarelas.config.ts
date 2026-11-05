import type { PasarelaId } from "../types/pasarelas.types"

/**
 * Configuración centralizada y modular de pasarelas en el frontend.
 * Permite deshabilitar o retirar pasarelas con solo cambiar una bandera,
 * cumpliendo el principio Open/Closed sin tocar vistas ni componentes.
 */
export interface PasarelaConfig {
  habilitada: boolean
}

export const CONFIG_PASARELAS_FRONTEND: Record<PasarelaId, PasarelaConfig> = {
  WAYRA: { habilitada: true },
  STRIPE: { habilitada: true },
  PAYPAL: { habilitada: true },
  QR_BANCARIO: { habilitada: true },
  MANUAL: { habilitada: true },
}

export function estaPasarelaHabilitada(id: PasarelaId): boolean {
  return CONFIG_PASARELAS_FRONTEND[id]?.habilitada ?? true
}
