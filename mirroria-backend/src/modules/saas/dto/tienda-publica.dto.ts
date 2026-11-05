export class TiendaPublicaDto {
  id!: string;
  slug!: string;
  nombre!: string;
  /** false → el front muestra "Tienda no disponible". */
  disponible!: boolean;
}
