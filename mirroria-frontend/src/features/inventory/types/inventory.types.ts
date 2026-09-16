// Espejo de los DTOs de mirroria-backend/src/modules/inventario

export interface InventarioSucursal {
  id: string
  varianteId: string
  sucursalId: string
  cantidadDisponible: number
  cantidadReservada: number
  cantidadEnTransito: number
}
