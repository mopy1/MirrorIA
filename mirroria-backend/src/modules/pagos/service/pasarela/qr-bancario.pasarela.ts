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
export class QrBancarioPasarela implements IPasarelaProveedor {
  readonly id: PasarelaId = 'QR_BANCARIO';
  readonly metadata: PasarelaMetadata = {
    id: 'QR_BANCARIO',
    nombre: 'QR Bancario Directo (ASOBAN / Libélula)',
    descripcion: 'Integración directa con switch interbancario formal para QR BCB/ASFI.',
    tipo: 'QR',
    estado: 'EN_DESARROLLO',
    soportaCheckout: false,
    soportaSuscripcion: true,
    icono: 'qr-code',
    monedas: ['BOB'],
  };

  estaConfigurada(): boolean {
    return false;
  }

  iniciarCobro(_params: IniciarCobroParams): Promise<IniciarCobroResultado> {
    throw new PasarelaNoConfiguradaException('La pasarela QR Bancario se encuentra en desarrollo.');
  }

  verificarNotificacion(
    _cuerpoCrudo: Buffer,
    _cabeceras: Record<string, string>,
  ): Promise<EventoNotificacionVerificado> {
    throw new PasarelaNoConfiguradaException('La pasarela QR Bancario se encuentra en desarrollo.');
  }
}
