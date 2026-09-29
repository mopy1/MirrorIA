// Etiquetas para la clienta (el panel admin tiene las suyas en
// `reservas-table.data.ts`, con otro tono: "No asistió", "Expirada").
const ETIQUETAS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  EN_TIENDA: "En tienda",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
  EXPIRADA: "Vencida",
  NO_SHOW: "No te presentaste",
}

export const etiquetaEstadoReserva = (estado: string) => ETIQUETAS[estado] ?? estado
