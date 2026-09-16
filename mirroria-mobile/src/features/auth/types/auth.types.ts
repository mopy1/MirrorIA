export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

// Coincide con RolUsuario en mirroria-backend (modules/seguridad/entities/usuario.entity.ts)
export type UsuarioRole = 'CUSTOMER' | 'ADMIN' | 'ENCARGADO_SUCURSAL' | 'CAJERO';

export interface UsuarioResponse {
  id: string;
  email: string;
  fullName: string;
  role: UsuarioRole;
}

export interface AuthResponse {
  accessToken: string;
  usuario: UsuarioResponse;
}
