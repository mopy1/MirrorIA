import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { FirmaWebhookInvalidaException } from '../../exception/firma-webhook-invalida.exception.js';
import type { EventoPago, Pasarela, SesionPago } from './pasarela.interface.js';

/** La firma que acepta la pasarela simulada. No es un secreto: es una convencion de pruebas. */
export const FIRMA_SIMULADA = 'firma-simulada';

/**
 * Pasarela de mentira, para las pruebas y para poder demostrar el cobro sin
 * internet ni claves. Rechaza firmas invalidas a proposito: una simulada que
 * acepta cualquier cosa haria pasar pruebas que no prueban nada.
 */
@Injectable()
export class PasarelaSimulada implements Pasarela {
  estaConfigurada(): boolean {
    return true;
  }

  crearSesion(params: {
    montoCents: number; descripcion: string; referencia: string;
    urlExito: string; urlCancelacion: string;
  }): Promise<SesionPago> {
    const id = `sim_${randomUUID()}`;
    return Promise.resolve({ id, url: `${params.urlExito}?sesion=${id}` });
  }

  verificarEvento(cuerpoCrudo: Buffer, firma: string): EventoPago {
    if (firma !== FIRMA_SIMULADA) {
      throw new FirmaWebhookInvalidaException();
    }
    const cuerpo = JSON.parse(cuerpoCrudo.toString('utf8')) as { id: string; sesionId: string };
    return { id: cuerpo.id, tipo: 'pagado', sesionId: cuerpo.sesionId };
  }
}
