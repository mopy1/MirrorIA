import { useEffect, useState } from "react"
import type { ProductoMini } from "@/components/marca/vista-previa"
import { saasApi } from "../api/saasApi"

/**
 * Dos prendas reales (con foto) de cada tienda del abanico, por slug. Si una
 * tienda falla o no tiene prendas, su vista previa usa las tarjetas vacías.
 */
export function usePrendasAbanico(slugs: string[]): Record<string, ProductoMini[]> {
  const [prendas, setPrendas] = useState<Record<string, ProductoMini[]>>({})
  const clave = slugs.join(",")
  useEffect(() => {
    let cancelado = false
    for (const slug of clave ? clave.split(",") : []) {
      saasApi
        .getPrendas(slug)
        .then((lista) => {
          if (cancelado) return
          const mini = lista
            .filter((p) => p.activo && p.imagenes.length > 0)
            .slice(0, 2)
            .map((p) => ({ id: p.id, nombre: p.titulo, precioCents: p.precioCents, imagenUrl: p.imagenes[0].url }))
          setPrendas((prev) => ({ ...prev, [slug]: mini }))
        })
        .catch(() => undefined)
    }
    return () => {
      cancelado = true
    }
  }, [clave])
  return prendas
}
