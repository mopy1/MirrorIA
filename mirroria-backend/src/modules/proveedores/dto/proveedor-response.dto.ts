export class ProveedorResponseDto {
  id!: string;
  razonSocial!: string;
  nit!: string | null;
  contactoNombre!: string | null;
  contactoEmail!: string | null;
  contactoTelefono!: string | null;
  activo!: boolean;
}
