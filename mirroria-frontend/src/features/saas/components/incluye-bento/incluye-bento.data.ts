import { ChartBar, Clock, Coins, Sparkle, Storefront, type Icon } from "@phosphor-icons/react"

export interface CeldaBento {
  titulo: string
  texto: string
  icono: Icon
  /** Foto real (Unsplash, mismas de la tienda demo) o tinte del tema. */
  imagen?: string
  tinte?: "primario" | "acento"
  clase: string
}

export const CELDAS: CeldaBento[] = [
  {
    titulo: "Probador virtual con IA", texto: "Tus clientas se ven con la prenda puesta desde el celular, antes de reservarla.", icono: Sparkle,
    imagen: "https://images.unsplash.com/photo-1753161027818-28b1f73a8fdf?w=1200&h=900&fit=crop&q=80&auto=format", clase: "lg:col-span-3 lg:row-span-2 min-h-80",
  },
  { titulo: "Reservas para probarse", texto: "Reservan su talla y la encuentran separada en la sucursal.", icono: Clock, tinte: "acento", clase: "lg:col-span-3" },
  { titulo: "Cobro por QR y tarjeta", texto: "QR de cualquier banco boliviano, tarjeta o efectivo en tu local.", icono: Coins, tinte: "primario", clase: "lg:col-span-3" },
  { titulo: "Reportes que entienden tu voz", texto: "Preguntá \"¿qué vendí más este mes?\" y te responde con un gráfico.", icono: ChartBar, tinte: "primario", clase: "lg:col-span-2" },
  {
    titulo: "Varias sucursales, un solo stock", texto: "Cada sucursal ve lo suyo y vos ves todo.", icono: Storefront,
    imagen: "https://images.unsplash.com/photo-1761090617068-f1b3257d27ad?w=1600&h=700&fit=crop&q=80&auto=format", clase: "lg:col-span-4 min-h-56",
  },
]
