import { CreditCard, PaypalLogo, QrCode, type Icon } from "@phosphor-icons/react"

/** Lo que la Fase 2 va a devolver por pasarela; hoy es fijo y todas están "Próximamente". */
export interface PasarelaSuscripcion {
  codigo: string
  nombre: string
  detalle: string
  icono: Icon
  disponible: boolean
}

export const PASARELAS: PasarelaSuscripcion[] = [
  { codigo: "QR", nombre: "QR bancario", detalle: "Desde la app de cualquier banco boliviano, en bolivianos.", icono: QrCode, disponible: false },
  { codigo: "TARJETA", nombre: "Tarjeta de crédito o débito", detalle: "Visa o Mastercard, cobro mensual.", icono: CreditCard, disponible: false },
  { codigo: "PAYPAL", nombre: "PayPal", detalle: "En dólares, desde el exterior.", icono: PaypalLogo, disponible: false },
]
