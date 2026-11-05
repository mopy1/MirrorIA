import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { RolUsuario } from '../entities/usuario.entity.js';

export class UpdateUsuarioRolDto {
  // Sin DUENO_PLATAFORMA: ese rol solo lo crea el seed (si no, un ADMIN de una
  // tienda podría darse acceso a la plataforma).
  @IsIn([RolUsuario.CUSTOMER, RolUsuario.ADMIN, RolUsuario.ENCARGADO_SUCURSAL, RolUsuario.CAJERO])
  role!: RolUsuario;

  // Obligatorio en la práctica para ENCARGADO_SUCURSAL/CAJERO (ver Usuario.sucursalId),
  // validado en el service, no acá — no la fuerza el DTO porque depende del valor de `role`.
  @IsOptional()
  @IsUUID()
  sucursalId?: string;
}
