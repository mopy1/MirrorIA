// Espejo de los DTOs de mirroria-backend/src/modules/sucursales

export interface Ciudad {
  id: string
  nombre: string
  pais: string
}

export interface Sucursal {
  id: string
  ciudadId: string
  ciudadNombre: string
  nombre: string
  direccion: string
  telefono: string | null
  activo: boolean
}
