import type { InquilinoResumenDto } from './inquilino.dto.js';

export class ResumenPlataformaDto {
  inquilinos!: { total: number; activos: number; suspendidos: number; enTrial: number; vencidos: number };
  /** suma de precio_cents de las suscripciones ACTIVA vigentes */
  mrrCents!: number;
  altasUltimos30Dias!: number;
  /** TRIAL con diasRestantes ≤ 7 */
  trialsPorVencer!: InquilinoResumenDto[];
}
