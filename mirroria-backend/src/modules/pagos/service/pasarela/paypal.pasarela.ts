import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirmaWebhookInvalidaException } from '../../exception/firma-webhook-invalida.exception.js';
import { PasarelaNoConfiguradaException } from '../../exception/pasarela-no-configurada.exception.js';
import { centavosBobAUsd, tipoCambioBobUsd } from './moneda.js';
import type {
  ConfirmacionCobro,
  EventoNotificacionVerificado,
  IniciarCobroParams,
  IniciarCobroResultado,
  IPasarelaProveedor,
  PasarelaId,
  PasarelaMetadata,
} from './pasarela.interface.js';

const API_SANDBOX = 'https://api-m.sandbox.paypal.com';
const API_LIVE = 'https://api-m.paypal.com';
const MAX_DESCRIPCION = 127; // Tope de PayPal para purchase_units[].description

interface RespuestaPaypal {
  status: number;
  // PayPal devuelve formas distintas por endpoint; cada llamador lee lo suyo.
  body: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * PayPal por su API REST (Orders v2), sin SDK. A diferencia de Stripe, aprobar
 * la orden NO cobra: el dinero se mueve recien con la captura, y por eso
 * `confirmarCobro` es la unica via que da un cobro por hecho.
 */
@Injectable()
export class PaypalPasarela implements IPasarelaProveedor {
  private readonly logger = new Logger(PaypalPasarela.name);
  private readonly clienteId: string | undefined;
  private readonly secreto: string | undefined;
  private readonly webhookId: string | undefined;
  private readonly api: string;
  private readonly tipoCambio: number;
  private tokenAcceso: { valor: string; venceEn: number } | null = null;

  readonly id: PasarelaId = 'PAYPAL';
  readonly metadata: PasarelaMetadata;

  constructor(config: ConfigService) {
    this.clienteId = config.get<string>('PAYPAL_CLIENT_ID');
    this.secreto = config.get<string>('PAYPAL_CLIENT_SECRET');
    this.webhookId = config.get<string>('PAYPAL_WEBHOOK_ID');
    this.api = config.get<string>('PAYPAL_ENTORNO') === 'live' ? API_LIVE : API_SANDBOX;
    this.tipoCambio = tipoCambioBobUsd(config);
    this.metadata = {
      id: 'PAYPAL',
      nombre: 'PayPal',
      descripcion: 'Billetera digital global y pagos internacionales con cuenta PayPal.',
      tipo: 'BILLETERA',
      estado: this.estaConfigurada() ? 'DISPONIBLE' : 'NO_CONFIGURADA',
      soportaCheckout: true,
      soportaSuscripcion: true,
      icono: 'paypal-logo',
      monedas: ['USD'],
    };
  }

  estaConfigurada(): boolean {
    return Boolean(this.clienteId && this.secreto);
  }

  async iniciarCobro(params: IniciarCobroParams): Promise<IniciarCobroResultado> {
    if (!this.estaConfigurada()) {
      throw new PasarelaNoConfiguradaException('PayPal no está configurado en este servidor.');
    }
    // PayPal no cobra en bolivianos.
    const cents = params.montoUsdCents || centavosBobAUsd(params.montoCents, this.tipoCambio);

    const { status, body } = await this.llamar('/v2/checkout/orders', {
      method: 'POST',
      idempotencia: params.referencia,
      cuerpo: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            custom_id: params.referencia,
            description: params.descripcion.slice(0, MAX_DESCRIPCION),
            amount: { currency_code: 'USD', value: (cents / 100).toFixed(2) },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: params.nombreComercio,
              user_action: 'PAY_NOW',
              shipping_preference: 'NO_SHIPPING',
              return_url: params.urlExito,
              cancel_url: params.urlCancelacion,
            },
          },
        },
      }),
    });

    const enlaces: { rel: string; href: string }[] = body?.links ?? [];
    const url = enlaces.find((l) => l.rel === 'payer-action' || l.rel === 'approve')?.href;
    if (status >= 300 || !url) {
      this.logger.error(`PayPal no creo la orden (${status}): ${JSON.stringify(body)}`);
      throw new PasarelaNoConfiguradaException('PayPal no pudo iniciar el cobro. Probá de nuevo.');
    }
    return {
      modo: 'REDIRECT',
      url,
      token: body.id,
      expiraEn: params.expiraEn,
      montoCobrado: { cents, moneda: 'USD' },
    };
  }

  /** Captura la orden. La clave de idempotencia hace seguro llamarla dos veces. */
  async confirmarCobro(ordenId: string): Promise<ConfirmacionCobro> {
    try {
      const ruta = `/v2/checkout/orders/${encodeURIComponent(ordenId)}`;
      const { status, body } = await this.llamar(`${ruta}/capture`, {
        method: 'POST',
        idempotencia: `captura-${ordenId}`,
        cuerpo: '{}',
      });
      if (status < 300) return this.leerCaptura(body);

      const problema: string | undefined = body?.details?.[0]?.issue;
      if (problema === 'ORDER_ALREADY_CAPTURED') {
        return this.leerCaptura((await this.llamar(ruta, { method: 'GET' })).body);
      }
      if (problema === 'INSTRUMENT_DECLINED') return { estado: 'RECHAZADO' };
      if (problema !== 'ORDER_NOT_APPROVED') {
        this.logger.warn(`Captura de la orden ${ordenId} sin resolver (${status}): ${problema ?? '?'}`);
      }
      return { estado: 'PENDIENTE' };
    } catch (error) {
      this.logger.warn(`No se pudo capturar la orden ${ordenId}: ${String(error)}`);
      return { estado: 'PENDIENTE' };
    }
  }

  async verificarNotificacion(
    cuerpoCrudo: Buffer,
    cabeceras: Record<string, string>,
  ): Promise<EventoNotificacionVerificado> {
    if (!this.estaConfigurada() || !this.webhookId) {
      throw new FirmaWebhookInvalidaException();
    }
    const crudo = cuerpoCrudo.toString('utf8');
    const campos = JSON.stringify({
      auth_algo: cabeceras['paypal-auth-algo'],
      cert_url: cabeceras['paypal-cert-url'],
      transmission_id: cabeceras['paypal-transmission-id'],
      transmission_sig: cabeceras['paypal-transmission-sig'],
      transmission_time: cabeceras['paypal-transmission-time'],
      webhook_id: this.webhookId,
    });
    // El evento va pegado tal cual llego: la firma es sobre esos bytes, y
    // parsearlo y volver a serializarlo puede hacer fallar la verificacion.
    const { body } = await this.llamar('/v1/notifications/verify-webhook-signature', {
      method: 'POST',
      cuerpo: `${campos.slice(0, -1)},"webhook_event":${crudo}}`,
    }).catch(() => ({ body: null }));
    if (body?.verification_status !== 'SUCCESS') {
      this.logger.warn('Aviso de PayPal con firma invalida');
      throw new FirmaWebhookInvalidaException();
    }

    const evento = JSON.parse(crudo) as {
      id: string;
      event_type: string;
      resource?: { id?: string; supplementary_data?: { related_ids?: { order_id?: string } } };
    };
    if (evento.event_type === 'CHECKOUT.ORDER.APPROVED') {
      return { id: evento.id, tipo: 'PAGO_APROBADO', referenciaExterna: evento.resource?.id ?? '' };
    }
    if (evento.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      return {
        id: evento.id,
        tipo: 'PAGO_APROBADO',
        referenciaExterna: evento.resource?.supplementary_data?.related_ids?.order_id ?? '',
      };
    }
    return { id: evento.id, tipo: 'OTRO', referenciaExterna: evento.resource?.id ?? '' };
  }

  private leerCaptura(orden: RespuestaPaypal['body']): ConfirmacionCobro {
    const captura = orden?.purchase_units?.[0]?.payments?.captures?.[0];
    if (captura?.status === 'COMPLETED') {
      return {
        estado: 'APROBADO',
        transaccion: captura.id,
        montoCents: Math.round(Number(captura.amount?.value) * 100),
      };
    }
    return captura?.status === 'DECLINED' ? { estado: 'RECHAZADO' } : { estado: 'PENDIENTE' };
  }

  private async llamar(
    ruta: string,
    opciones: { method: 'GET' | 'POST'; cuerpo?: string; idempotencia?: string },
  ): Promise<RespuestaPaypal> {
    const respuesta = await fetch(`${this.api}${ruta}`, {
      method: opciones.method,
      headers: {
        Authorization: `Bearer ${await this.obtenerToken()}`,
        'Content-Type': 'application/json',
        ...(opciones.idempotencia ? { 'PayPal-Request-Id': opciones.idempotencia } : {}),
      },
      body: opciones.cuerpo,
    });
    return { status: respuesta.status, body: await respuesta.json().catch(() => null) };
  }

  private async obtenerToken(): Promise<string> {
    if (this.tokenAcceso && this.tokenAcceso.venceEn > Date.now()) {
      return this.tokenAcceso.valor;
    }
    const credenciales = Buffer.from(`${this.clienteId}:${this.secreto}`).toString('base64');
    const respuesta = await fetch(`${this.api}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credenciales}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!respuesta.ok) {
      this.logger.error(`PayPal rechazo las credenciales (${respuesta.status})`);
      throw new PasarelaNoConfiguradaException('PayPal no aceptó las credenciales del servidor.');
    }
    const { access_token, expires_in } = (await respuesta.json()) as {
      access_token: string;
      expires_in: number;
    };
    // Un minuto de margen para no usar un token a punto de vencer.
    this.tokenAcceso = { valor: access_token, venceEn: Date.now() + (expires_in - 60) * 1000 };
    return access_token;
  }
}
