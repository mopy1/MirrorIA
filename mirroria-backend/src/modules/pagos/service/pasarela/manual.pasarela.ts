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
export class ManualPasarela implements IPasarelaProveedor {
  readonly id: PasarelaId = 'MANUAL';
  readonly metadata: PasarelaMetadata = {
    id: 'MANUAL',
    nombre: 'Efectivo en Sucursal',
    descripcion: 'Paga en efectivo al retirar tus prendas en la sucursal seleccionada.',
    tipo: 'EFECTIVO',
    estado: 'DISPONIBLE',
    soportaCheckout: true,
    soportaSuscripcion: false,
    icono: 'money',
    monedas: ['BOB'],
  };

  estaConfigurada(): boolean {
    return true;
  }

  iniciarCobro(_params: IniciarCobroParams): Promise<IniciarCobroResultado> {
    return Promise.resolve({
      modo: 'INSTRUCCIONES',
      instrucciones: 'Pagá en efectivo al retirar tu pedido en la sucursal elegida.',
    });
  }

  verificarNotificacion(
    _cuerpoCrudo: Buffer,
    _cabeceras: Record<string, string>,
  ): Promise<EventoNotificacionVerificado> {
    throw new PasarelaNoConfiguradaException('El cobro manual en sucursal no emite notificaciones automáticas.');
  }
}
