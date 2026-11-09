// Espejo de ProveedorResponseDto en mirroria-backend/src/modules/proveedores

export interface Proveedor {
  id: string;
  razonSocial: string;
  nit: string | null;
  contactoNombre: string | null;
  contactoEmail: string | null;
  contactoTelefono: string | null;
  activo: boolean;
}

export interface CreateProveedorDto {
  razonSocial: string;
  nit?: string;
  contactoNombre?: string;
  contactoEmail?: string;
  contactoTelefono?: string;
}
