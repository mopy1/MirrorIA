export type MotivoSlugNoDisponible = 'FORMATO' | 'RESERVADO' | 'OCUPADO';

export class DisponibilidadSlugDto {
  /** Ya normalizado (trim + minúsculas). */
  slug!: string;
  disponible!: boolean;
  motivo!: MotivoSlugNoDisponible | null;
}
