import { useEffect, useState } from "react"
import type { ProductoMini } from "@/components/marca/vista-previa"
import { aparienciaApi } from "../api/aparienciaApi"

/** Hasta 3 prendas activas de la tienda para la vista previa (si falla, la vista previa usa tarjetas vacías). */
export function useProductosPreview(): ProductoMini[] {
  const [productos, setProductos] = useState<ProductoMini[]>([])
  useEffect(() => {
    let cancelado = false
    aparienciaApi
      .productos()
      .then((lista) => {
        if (cancelado) return
        const conFoto = lista.filter((p) => p.activo).sort((a, b) => b.imagenes.length - a.imagenes.length)
        setProductos(conFoto.slice(0, 3).map((p) => ({ id: p.id, nombre: p.titulo, precioCents: p.precioCents, imagenUrl: p.imagenes[0]?.url ?? null })))
      })
      .catch(() => undefined)
    return () => {
      cancelado = true
    }
  }, [])
  return productos
}
