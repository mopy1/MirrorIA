import type { ActualizarMarcaDto } from "@/types/marca.types"

/** Lo que se edita en /admin/apariencia: la marca completa + el nombre visible. */
export type BorradorMarca = ActualizarMarcaDto

/** Errores por campo, con la ruta del campo como clave (`hero.titulo`, `contacto.email`...). */
export type ErroresMarca = Partial<Record<string, string>>

export type PestanaApariencia = "marca" | "colores" | "portada" | "imagenes" | "textos"

export interface ProductoCatalogoMini {
  id: string
  titulo: string
  precioCents: number
  activo: boolean
  imagenes: { url: string }[]
}
