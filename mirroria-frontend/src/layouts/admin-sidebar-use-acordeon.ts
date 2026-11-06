import { useCallback, useState } from "react"
import { STORAGE_GRUPOS, type NavGroup } from "./admin-sidebar.data"
import { escribirStorage, grupoDeRuta, leerStorage, parsearGrupos } from "./admin-sidebar-logica"

/**
 * Acordeón del menú: varios grupos abiertos a la vez (default: todos abiertos).
 * Recuerda lo que la persona cerró en `localStorage`; al entrar a una página de
 * un grupo cerrado, ese grupo se abre (y la persona lo puede volver a cerrar).
 */
export function useSidebarAcordeon(groups: NavGroup[], pathname: string) {
  // Al montar (o recargar) en una página de un grupo guardado como cerrado, ese grupo arranca abierto.
  const [estado, setEstado] = useState<Record<string, boolean>>(() => {
    const guardado = parsearGrupos(leerStorage(STORAGE_GRUPOS))
    const activo = grupoDeRuta(groups, pathname)
    return activo ? { ...guardado, [activo]: true } : guardado
  })
  const [rutaVista, setRutaVista] = useState(pathname)
  const grupoActivo = grupoDeRuta(groups, pathname)

  // Estado derivado durante el render (patrón de React): al cambiar de ruta se
  // abre el grupo de la página nueva sin un efecto ni un render "cerrado" previo.
  if (rutaVista !== pathname) {
    setRutaVista(pathname)
    // Sin escribir storage acá (el render queda puro): se persiste en el próximo clic.
    if (grupoActivo && estado[grupoActivo] === false) setEstado({ ...estado, [grupoActivo]: true })
  }

  const estaAbierto = useCallback((id: string) => estado[id] ?? true, [estado])

  const alternar = useCallback((id: string, abierto: boolean) => {
    setEstado((prev) => {
      const siguiente = { ...prev, [id]: abierto }
      escribirStorage(STORAGE_GRUPOS, JSON.stringify(siguiente))
      return siguiente
    })
  }, [])

  return { estaAbierto, alternar, grupoActivo }
}
