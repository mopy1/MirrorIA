import { IsIn, IsOptional, IsString } from 'class-validator';
import type { EstadoInquilino } from '../entities/inquilino.entity.js';
import type { NivelMarca } from '../marca/marca-reglas.js';
import type { EventoPlataformaDto } from './evento-plataforma.dto.js';
import type { MarcaMiniDto, MarcaPublicaDto } from './marca.dto.js';
import type { LimitesPlanDto } from './plan.dto.js';
import type { SuscripcionDto, UsoPlanDto } from './suscripcion.dto.js';

export const ORDENES_INQUILINOS = ['recientes', 'por-vencer', 'nombre', 'mrr'] as const;
export type OrdenInquilinos = (typeof ORDENES_INQUILINOS)[number];

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
  /** Fase 1b */
  marca!: MarcaMiniDto;
  /** precio de la suscripción más reciente si está ACTIVA; 0 si no. */
  mrrCents!: number;
}

export class InquilinoDetalleDto extends InquilinoResumenDto {
  motivoSuspension!: string | null;
  limites!: LimitesPlanDto;
  historial!: SuscripcionDto[];
  sucursales!: number;
  productos!: number;
  ventasPagadas30d!: number;
  marcaCompleta!: MarcaPublicaDto;
  nivelMarca!: NivelMarca;
  /** 50 eventos más recientes de esta tienda. */
  actividad!: EventoPlataformaDto[];
}

export class FiltroInquilinosDto {
  @IsOptional() @IsIn(['ACTIVO', 'SUSPENDIDO'])
  estado?: 'ACTIVO' | 'SUSPENDIDO';

  @IsOptional() @IsIn(['TRIAL', 'ACTIVA', 'VENCIDA'])
  suscripcion?: 'TRIAL' | 'ACTIVA' | 'VENCIDA';

  @IsOptional() @IsString()
  q?: string;

  /** Código del plan. */
  @IsOptional() @IsString()
  plan?: string;

  @IsOptional() @IsIn(ORDENES_INQUILINOS)
  orden?: OrdenInquilinos;
}
