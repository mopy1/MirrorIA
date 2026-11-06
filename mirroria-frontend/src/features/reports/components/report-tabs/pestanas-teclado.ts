/** Índice de la pestaña a la que mueve el teclado (patrón ARIA de pestañas, con vuelta circular).
 * null = la tecla no es de navegación. */
export function indiceSegunTecla(actual: number, total: number, tecla: string): number | null {
  if (total === 0) return null
  switch (tecla) {
    case "ArrowRight":
      return (actual + 1) % total
    case "ArrowLeft":
      return (actual - 1 + total) % total
    case "Home":
      return 0
    case "End":
      return total - 1
    default:
      return null
  }
}

export const idPestana = (id: string) => `pestana-reporte-${id}`
export const ID_PANEL = "panel-reportes"
