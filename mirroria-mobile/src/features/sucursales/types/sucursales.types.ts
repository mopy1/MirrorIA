export interface SucursalResponseDto {
  id: string;
  ciudadId: string;
  ciudadNombre: string;
  nombre: string;
  direccion: string;
  telefono: string | null;
  activo: boolean;
}
