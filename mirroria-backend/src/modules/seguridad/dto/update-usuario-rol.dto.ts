import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { RolUsuario } from '../entities/usuario.entity.js';

export class UpdateUsuarioRolDto {
  @IsEnum(RolUsuario)
  role!: RolUsuario;

  // Obligatorio en la práctica para ENCARGADO_SUCURSAL/CAJERO (ver Usuario.sucursalId),
  // validado en el service, no acá — no la fuerza el DTO porque depende del valor de `role`.
  @IsOptional()
  @IsUUID()
  sucursalId?: string;
}
