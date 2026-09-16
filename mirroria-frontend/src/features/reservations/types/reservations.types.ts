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
