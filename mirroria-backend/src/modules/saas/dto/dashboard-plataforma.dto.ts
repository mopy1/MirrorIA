import type { EventoPlataformaDto } from './evento-plataforma.dto.js';
import type { InquilinoResumenDto } from './inquilino.dto.js';

export class DashboardPlataformaDto {
  tiendas!: { total: number; activas: number; enPrueba: number; vencidas: number; suspendidas: number };
  /** Σ precio_cents de la suscripción más reciente de cada tienda con estado efectivo ACTIVA. */
  mrrCents!: number;
  arrCents!: number;
  mrrPorPlan!: { codigo: string; nombre: string; tiendas: number; mrrCents: number }[];
  /** Mes calendario de La Paz. */
  altasMes!: number;
  altasMesAnterior!: number;
  /** 12 meses ('YYYY-MM'), del más viejo al actual, con ceros. */
  altasPorMes!: { mes: string; altas: number }[];
  churn30d!: { tasa: number; perdidas: number; base: number };
  conversionPrueba!: { tasa: number; convertidas: number; cerradas: number };
  /** Ventas PAGADA/ENTREGADA de todas las tiendas (agregado). */
  gmv30d!: { ventas: number; montoCents: number };
  trialsPorVencer!: InquilinoResumenDto[];
  actividad!: EventoPlataformaDto[];
}
