// Espejo de UsuarioAdmin de mirroria-frontend/src/features/admin/api/usuariosAdminApi.ts

export type RolUsuario = 'ADMIN' | 'ENCARGADO_SUCURSAL' | 'CAJERO' | 'CUSTOMER';

export interface UsuarioAdmin {
  id: string;
  email: string;
  fullName: string;
  role: string;
  sucursalId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CambioRolDto {
  role: string;
  sucursalId?: string;
}

export interface SucursalOpcion {
  id: string;
  nombre: string;
  ciudadNombre: string;
}
