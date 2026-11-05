import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import QRCode from 'qrcode';
import { FirmaWebhookInvalidaException } from '../../exception/firma-webhook-invalida.exception.js';
import type { AvisoPagoQr } from '../qr/aviso-pago-qr.js';
import { firmaAvisoValida, secretoAvisosQr } from '../qr/firma-aviso.js';
import type {
  EventoNotificacionVerificado,
  IniciarCobroParams,
  IniciarCobroResultado,
  IPasarelaProveedor,
  PasarelaId,
  PasarelaMetadata,
} from './pasarela.interface.js';

@Injectable()
export class WayraPasarela implements IPasarelaProveedor {
  private readonly logger = new Logger(WayraPasarela.name);

  readonly id: PasarelaId = 'WAYRA';
  readonly metadata: PasarelaMetadata = {
    id: 'WAYRA',
    nombre: 'QR Simple (Banco Wayra)',
    descripcion: 'Pago interoperable instantáneo mediante código QR Simple (BCB/ASFI).',
    tipo: 'QR',
    estado: 'DISPONIBLE',
    soportaCheckout: true,
    soportaSuscripcion: true,
    icono: 'qr-code',
    monedas: ['BOB'],
  };

  constructor(private readonly config: ConfigService) {}

  estaConfigurada(): boolean {
    return this.config.get<string>('WAYRA_HABILITADO') !== 'false';
  }

  async iniciarCobro(params: IniciarCobroParams): Promise<IniciarCobroResultado> {
    const token = randomBytes(18).toString('base64url');
    const qrTexto = this.urlDelQr(token);
    const qrBase64 = await QRCode.toDataURL(qrTexto, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: 'M',
    });
    const expiraEn = params.expiraEn ?? new Date(Date.now() + 15 * 60 * 1000);

    return {
      modo: 'QR',
      qrBase64,
      qrTexto,
      token,
      expiraEn,
    };
  }

  async verificarNotificacion(
    cuerpoCrudo: Buffer,
    cabeceras: Record<string, string>,
  ): Promise<EventoNotificacionVerificado> {
    const firma = cabeceras['x-wayra-firma'] ?? cabeceras['X-Wayra-Firma'] ?? '';
    if (!firmaAvisoValida(cuerpoCrudo, firma, secretoAvisosQr(this.config))) {
      this.logger.warn('Aviso Wayra con firma HMAC inválida');
      throw new FirmaWebhookInvalidaException();
    }
    let aviso: AvisoPagoQr;
    try {
      aviso = JSON.parse(cuerpoCrudo.toString('utf8')) as AvisoPagoQr;
    } catch {
      throw new FirmaWebhookInvalidaException();
    }
    return {
      id: aviso.id,
      tipo: aviso.tipo === 'cobro_qr.pagado' ? 'PAGO_APROBADO' : 'OTRO',
      referenciaExterna: aviso.token,
      montoCents: aviso.montoCents,
    };
  }

  private urlDelQr(token: string): string {
    const explicita = this.config.get<string>('WAYRA_URL_BASE');
    if (explicita) {
      return `${explicita.replace(/\/+$/, '')}/wayra/pagar/${token}`;
    }
    const exito = this.config.get<string>('PAGOS_URL_EXITO');
    try {
      const base = exito ? new URL(exito).origin : 'http://localhost:5174';
      return `${base}/wayra/pagar/${token}`;
    } catch {
      return `http://localhost:5174/wayra/pagar/${token}`;
    }
  }
}
