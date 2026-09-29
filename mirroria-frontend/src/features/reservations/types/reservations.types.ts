// Espejo de los DTOs de mirroria-backend/src/modules/reservas

export interface ReservaItem {
  id: string
  varianteId: string
  cantidad: number
}

export interface Reserva {
  id: string
  clienteId: string
  sucursalId: string
  estado: string
  fechaHoraPrevista: string
  createdAt: string
  items: ReservaItem[]
}

// GET /reservas/mias/cupo — reglas anti-acaparamiento vigentes para la clienta
export interface CupoReserva {
  puedeReservar: boolean
  motivo: string | null
  reservasActivas: number
  maxReservasActivas: number
  faltasRecientes: number
  faltasParaBloqueo: number
  bloqueadaHasta: string | null
  maxUnidadesPorVariante: number
  maxPrendasPorReserva: number
  anticipacionMinimaMinutos: number
  ventanaMaximaHoras: number
  toleranciaMinutos: number
}
