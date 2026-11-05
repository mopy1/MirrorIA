import { Injectable } from '@nestjs/common';
import { PasarelaNoConfiguradaException } from '../../exception/pasarela-no-configurada.exception.js';
import type {
  EventoNotificacionVerificado,
  IniciarCobroParams,
  IniciarCobroResultado,
  IPasarelaProveedor,
  PasarelaId,
  PasarelaMetadata,
} from './pasarela.interface.js';

@Injectable()
export class PaypalPasarela implements IPasarelaProveedor {
  readonly id: PasarelaId = 'PAYPAL';
  readonly metadata: PasarelaMetadata = {
    id: 'PAYPAL',
    nombre: 'PayPal',
    descripcion: 'Billetera digital global y pagos internacionales con cuenta PayPal.',
    tipo: 'BILLETERA',
    estado: 'EN_DESARROLLO',
    soportaCheckout: false,
    soportaSuscripcion: true,
    icono: 'paypal-logo',
    monedas: ['USD'],
  };

  estaConfigurada(): boolean {
    return false;
  }

  iniciarCobro(_params: IniciarCobroParams): Promise<IniciarCobroResultado> {
    throw new PasarelaNoConfiguradaException('La pasarela PayPal se encuentra en desarrollo.');
  }

  verificarNotificacion(
    _cuerpoCrudo: Buffer,
    _cabeceras: Record<string, string>,
  ): Promise<EventoNotificacionVerificado> {
    throw new PasarelaNoConfiguradaException('La pasarela PayPal se encuentra en desarrollo.');
  }
}
