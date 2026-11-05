import type { MarcaPublica } from "@/types/marca.types"

export interface ProductoMini {
  id: string
  nombre: string
  precioCents: number
  imagenUrl: string | null
}

export type Dispositivo = "escritorio" | "celular"

export interface PropsPreview {
  marca: MarcaPublica
  nombre: string
  celular: boolean
}
