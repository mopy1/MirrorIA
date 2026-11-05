import { CreditCard, Money, PaypalLogo, QrCode, type Icon } from "@phosphor-icons/react"
import type { PasarelaId } from "@/features/payments/types/pasarelas.types"

export interface PasarelaSuscripcionFallback {
  codigo: PasarelaId
  nombre: string
  detalle: string
  icono: Icon
  disponible: boolean
}

export const PASARELAS_FALLBACK: PasarelaSuscripcionFallback[] = [
  { codigo: "WAYRA", nombre: "QR Simple (Wayra)", detalle: "Desde la app de cualquier banco boliviano, en bolivianos.", icono: QrCode, disponible: true },
  { codigo: "STRIPE", nombre: "Tarjeta de crédito o débito (Stripe)", detalle: "Visa o Mastercard, cobro seguro en línea.", icono: CreditCard, disponible: true },
  { codigo: "PAYPAL", nombre: "PayPal", detalle: "En dólares, desde el exterior.", icono: PaypalLogo, disponible: false },
  { codigo: "QR_BANCARIO", nombre: "QR Bancario Directo", detalle: "Integración formal bancaria.", icono: Money, disponible: false },
]
