import { IsBoolean } from 'class-validator';

export class UpdateUsuarioEstadoDto {
  @IsBoolean()
  isActive!: boolean;
}
