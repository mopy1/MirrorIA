// Espejo de los DTOs de mirroria-backend/src/modules/ventas

export interface CarritoItem {
  varianteId: string
  cantidad: number
}

export interface Carrito {
  id: string
  usuarioId: string
  items: CarritoItem[]
}
