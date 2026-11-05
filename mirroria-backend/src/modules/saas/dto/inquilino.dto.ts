import { IsIn, IsOptional, IsString } from 'class-validator';
import type { EstadoInquilino } from '../entities/inquilino.entity.js';
import type { LimitesPlanDto } from './plan.dto.js';
import type { SuscripcionDto, UsoPlanDto } from './suscripcion.dto.js';

export class InquilinoResumenDto {
  id!: string;
  nombre!: string;
  slug!: string;
  estado!: EstadoInquilino;
  disponible!: boolean;
  plan!: { codigo: string; nombre: string };
  suscripcion!: Pick<SuscripcionDto, 'estado' | 'fin' | 'diasRestantes'>;
  propietario!: { fullName: string; email: string } | null;
  uso!: UsoPlanDto;
  createdAt!: string;
}

export class InquilinoDetalleDto extends InquilinoResumenDto {
  motivoSuspension!: string | null;
  limites!: LimitesPlanDto;
  historial!: SuscripcionDto[];
  sucursales!: number;
  productos!: number;
  ventasPagadas30d!: number;
}

export class FiltroInquilinosDto {
  @IsOptional() @IsIn(['ACTIVO', 'SUSPENDIDO'])
  estado?: 'ACTIVO' | 'SUSPENDIDO';

  @IsOptional() @IsIn(['TRIAL', 'ACTIVA', 'VENCIDA'])
  suscripcion?: 'TRIAL' | 'ACTIVA' | 'VENCIDA';

  @IsOptional() @IsString()
  q?: string;
}
