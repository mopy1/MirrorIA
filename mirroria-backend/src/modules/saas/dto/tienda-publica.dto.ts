import type { MarcaPublicaDto } from './marca.dto.js';

export class TiendaPublicaDto {
  id!: string;
  slug!: string;
  nombre!: string;
  /** false → el front muestra "Tienda no disponible". */
  disponible!: boolean;
  /** Marca EFECTIVA (recortada por el nivel del plan). Fase 1b. */
  marca!: MarcaPublicaDto;
}
