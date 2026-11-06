import { useEffect, useState } from "react"
import { catalogApi } from "@/features/catalog/api/catalogApi"

/**
 * id de producto → nombre del catálogo. La predicción de demanda solo trae el id,
 * y un gerente reconoce la prenda por su nombre. Si el catálogo falla, queda vacío
 * y la pantalla cae al nombre aproximado (nunca muestra el id).
 */
export function useNombresPrendas(): Record<string, string> {
  const [nombres, setNombres] = useState<Record<string, string>>({})

  useEffect(() => {
    let activo = true
    catalogApi
      .getProductos()
      .then((productos) => {
        if (activo) setNombres(Object.fromEntries(productos.map((p) => [p.id, p.titulo])))
      })
      .catch(() => {
        if (activo) setNombres({})
      })
    return () => {
      activo = false
    }
  }, [])

  return nombres
}
