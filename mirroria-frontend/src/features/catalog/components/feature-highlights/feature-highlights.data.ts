import type { Icon } from "@phosphor-icons/react"
import { Aperture, MapPinLine, Package } from "@phosphor-icons/react"

export interface FeatureHighlight {
  icon: Icon
  title: string
  body: string
  imageId?: string
}

export const FEATURE_HIGHLIGHTS: FeatureHighlight[] = [
  {
    icon: Aperture,
    title: "Vestidor virtual",
    body: "Activá la cámara y mirá cómo te queda la prenda antes de reservarla.",
    // Unsplash, licencia libre: mujer probándose ropa en el probador.
    imageId: "1753161027818-28b1f73a8fdf",
  },
  {
    icon: MapPinLine,
    title: "Reservá por sucursal",
    body: "Elegí tienda y horario, y encontrá la prenda separada al llegar.",
  },
  {
    icon: Package,
    title: "Stock real por sucursal",
    body: "Antes de ir, consultá si tu talla está disponible en la tienda que elijas.",
  },
]
