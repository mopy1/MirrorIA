// Espejo de ProveedorResponseDto en mirroria-backend/src/modules/proveedores

export interface Proveedor {
  id: string
  razonSocial: string
  nit: string | null
  contactoNombre: string | null
  contactoEmail: string | null
  contactoTelefono: string | null
  activo: boolean
}
