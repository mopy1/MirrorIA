import { useCallback, useState } from "react"
import { STORAGE_COLAPSADO } from "./admin-sidebar.data"
import { escribirStorage, leerStorage } from "./admin-sidebar-logica"

/** Menú de escritorio reducido a íconos (solo `lg+`), recordado entre visitas. */
export function useSidebarColapsado() {
  const [colapsado, setColapsado] = useState(() => leerStorage(STORAGE_COLAPSADO) === "1")
  const alternar = useCallback(() => {
    setColapsado((prev) => {
      escribirStorage(STORAGE_COLAPSADO, prev ? "0" : "1")
      return !prev
    })
  }, [])
  return { colapsado, alternar }
}
