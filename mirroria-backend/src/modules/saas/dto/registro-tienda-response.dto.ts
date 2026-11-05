import { AuthResponseDto } from '../../seguridad/dto/auth-response.dto.js';
import type { SuscripcionDto } from './suscripcion.dto.js';
import type { TiendaPublicaDto } from './tienda-publica.dto.js';

export class RegistroTiendaResponse extends AuthResponseDto {
  tienda!: TiendaPublicaDto;
  /** estado 'TRIAL' */
  suscripcion!: SuscripcionDto;
  sucursalId!: string;
}
