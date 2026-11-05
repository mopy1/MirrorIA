export class TenantSesionDto {
  id!: string;
  slug!: string;
  nombre!: string;
}

export class UsuarioResponseDto {
  id!: string;
  email!: string;
  fullName!: string;
  role!: string;
  sucursalId!: string | null;
  /** null para DUENO_PLATAFORMA. Lo arma contextoTenant() (seguridad no importa saas). */
  tenant!: TenantSesionDto | null;
}

export class AuthResponseDto {
  accessToken!: string;
  usuario!: UsuarioResponseDto;
}
