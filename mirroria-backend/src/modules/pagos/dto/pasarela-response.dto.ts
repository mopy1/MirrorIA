import {
  EstadoPasarela,
  IconoPasarela,
  PasarelaId,
  TipoPasarela,
} from '../service/pasarela/pasarela.interface.js';

export class PasarelaResponseDto {
  id!: PasarelaId;
  nombre!: string;
  descripcion!: string;
  tipo!: TipoPasarela;
  estado!: EstadoPasarela;
  soportaCheckout!: boolean;
  soportaSuscripcion!: boolean;
  icono!: IconoPasarela;
  monedas!: ('BOB' | 'USD')[];
}
