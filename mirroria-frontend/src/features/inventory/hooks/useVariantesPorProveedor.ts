import { useMemo } from "react"
import { catalogApi } from "@/features/catalog/api/catalogApi"
import { useVariantesConProducto } from "@/features/catalog/hooks/useVariantesConProducto"
import { useResourceList } from "@/hooks/useResourceList"

/**
 * Cruza variante → producto.coleccionId → colecciones.proveedorId en
 * cliente (el catálogo ya trae ambos datos, sin endpoint nuevo). Lo usa el
 * diálogo de orden de compra para ofrecer solo prendas del proveedor
 * elegido y para deducir el proveedor al "Pedir al proveedor" desde stock.
 */
export function useVariantesPorProveedor(proveedorId: string) {
  const { variantes } = useVariantesConProducto()
  const colecciones = useResourceList(catalogApi.getColecciones)

  const proveedorPorColeccion = useMemo(
    () => new Map(colecciones.items.map((c) => [c.id, c.proveedorId])),
    [colecciones.items]
  )
  const proveedorDe = (varianteId: string) => {
    const v = variantes.find((it) => it.varianteId === varianteId)
    return v ? (proveedorPorColeccion.get(v.coleccionId) ?? "") : ""
  }
  const delProveedor = proveedorId
    ? variantes.filter((v) => proveedorPorColeccion.get(v.coleccionId) === proveedorId)
    : []

  return { variantes, delProveedor, proveedorDe }
}
