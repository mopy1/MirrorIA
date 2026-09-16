import type { RolUsuario } from '../entities/usuario.entity.js';

export class UsuarioAdminResponseDto {
  id!: string;
  email!: string;
  fullName!: string;
  role!: RolUsuario;
  sucursalId!: string | null;
  isActive!: boolean;
  createdAt!: Date;
}
