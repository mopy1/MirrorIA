import { IsString } from 'class-validator';

export class CambiarPlanDto {
  @IsString()
  planCodigo!: string;
}
