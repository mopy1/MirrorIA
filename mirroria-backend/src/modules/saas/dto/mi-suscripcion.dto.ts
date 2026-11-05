import type { PlanDto } from './plan.dto.js';
import type { SuscripcionDto, UsoPlanDto } from './suscripcion.dto.js';
import type { TiendaPublicaDto } from './tienda-publica.dto.js';

export class MiSuscripcionDto {
  tienda!: Omit<TiendaPublicaDto, 'marca'>;
  plan!: PlanDto;
  /** la más reciente */
  suscripcion!: SuscripcionDto;
  uso!: UsoPlanDto;
  /** todas, más nuevas primero */
  historial!: SuscripcionDto[];
  /** estado === 'TRIAL' */
  puedeCambiarPlan!: boolean;
  /** Fase 2 lo pone en true */
  pagoDisponible!: false;
}
