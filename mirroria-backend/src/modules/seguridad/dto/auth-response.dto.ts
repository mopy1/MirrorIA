export class UsuarioResponseDto {
  id!: string;
  email!: string;
  fullName!: string;
  role!: string;
}

export class AuthResponseDto {
  accessToken!: string;
  usuario!: UsuarioResponseDto;
}
