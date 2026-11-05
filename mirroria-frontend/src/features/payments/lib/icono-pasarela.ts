import {
  CreditCard,
  Money,
  PaypalLogo,
  QrCode,
  type Icon,
} from "@phosphor-icons/react"
import type { IconoPasarela } from "../types/pasarelas.types"

export const MAPA_ICONOS_PASARELA: Record<IconoPasarela, Icon> = {
  "credit-card": CreditCard,
  "qr-code": QrCode,
  "paypal-logo": PaypalLogo,
  money: Money,
}

export function iconoDePasarela(icono: IconoPasarela): Icon {
  return MAPA_ICONOS_PASARELA[icono] ?? CreditCard
}
