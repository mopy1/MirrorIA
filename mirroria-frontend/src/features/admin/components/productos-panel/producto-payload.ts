import type { ProductoFormData } from "./producto-form-fields"

export interface ProductoPayload {
  categoriaId: string
  coleccionId: string
  titulo: string
  slug: string
  descripcion: string | undefined
  precioCents: number
  /** `null` BORRA la URL en el backend; `undefined` la dejaria intacta. */
  arOverlayImageUrl: string | null
  /** URL del `.glb` que el Vestidor 3D del movil carga para esta prenda. */
  modeloArUrl: string | null
  imagenes: { url: string; orden: number; esArAsset: boolean }[]
}

/**
 * Arma el cuerpo que se le manda al backend desde el formulario de prenda.
 * Vive aparte de los dialogos (crear/editar) porque es la unica parte con
 * reglas propias y es lo que se puede probar sin montar React.
 */
export function construirPayloadProducto(form: ProductoFormData): ProductoPayload {
  const overlay = form.arOverlayImageUrl.trim()
  const modelo3D = form.modeloArUrl.trim()
  const imagen = form.imagenUrl.trim()

  return {
    categoriaId: form.categoriaId,
    coleccionId: form.coleccionId,
    titulo: form.titulo,
    slug: form.slug,
    descripcion: form.descripcion || undefined,
    precioCents: Math.round(Number(form.precio) * 100),
    // Vacio => `null`, no `undefined`: el servicio del backend solo asigna
    // cuando el campo viaja (`!== undefined`), asi que con `undefined` la
    // URL vieja quedaba para siempre y no habia forma de sacarla.
    arOverlayImageUrl: overlay || null,
    modeloArUrl: modelo3D || null,
    imagenes: imagen ? [{ url: imagen, orden: 0, esArAsset: false }] : [],
  }
}
