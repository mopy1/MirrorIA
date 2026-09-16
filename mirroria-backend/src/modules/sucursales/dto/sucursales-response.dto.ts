export class CiudadResponseDto {
  id!: string;
  nombre!: string;
  pais!: string;
}

export class SucursalResponseDto {
  id!: string;
  ciudadId!: string;
  ciudadNombre!: string;
  nombre!: string;
  direccion!: string;
  telefono!: string | null;
  activo!: boolean;
}
