import { IsOptional, IsUUID } from 'class-validator';

export class FiltroDashboardOperativoDto {
  @IsOptional()
  @IsUUID('4', { message: 'sucursalId debe ser un UUID valido' })
  sucursalId?: string;
}
